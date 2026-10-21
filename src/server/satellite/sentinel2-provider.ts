/**
 * Selector de proveedor Sentinel-2 L2A para los módulos que consultan escena + reflectancia
 * directamente (vegetación, referencia satelital de la foto, planificador).
 *
 * Orden: ver src/config/satellite-provider.config.ts (Planetary Computer por defecto,
 * Copernicus como respaldo opcional). La escena y su reflectancia salen SIEMPRE del mismo proveedor:
 * los sceneId de CDSE y de Planetary Computer no son intercambiables.
 *
 * Copernicus solo se usa con token OAuth real. Sin credenciales, o si el token cae a modo
 * simulado, el adaptador fabricaría escenas de ejemplo: aquí se salta y se pasa al respaldo,
 * para que un dato simulado nunca se presente como real.
 */

import { getSatelliteProviderOrder, type SatelliteProviderId } from "@/config/satellite-provider.config";
import { isCopernicusIntegrationEnabled } from "@/config/copernicus-integration.config";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import type {
  GeeReflectanceRecord,
  GeeReflectanceRequest,
  GeeSceneRecord,
  GeeSceneSearchRequest,
} from "@/server/gee/gee.adapter.types";
import { planetaryAdapter } from "@/server/planetary/planetary.adapter";
import { getCopernicusAdapter, satelliteCopernicusService } from "./satellite-copernicus.service";

export interface ProviderScenes {
  provider: SatelliteProviderId;
  scenes: GeeSceneRecord[];
}

export interface Sentinel2ProviderDeps {
  order: () => SatelliteProviderId[];
  copernicusUsable: () => Promise<boolean>;
  planetaryUsable: () => boolean;
  copernicus: {
    searchSentinel2Scenes(r: GeeSceneSearchRequest): Promise<GeeSceneRecord[]>;
    getReflectanceAtPoint(r: GeeReflectanceRequest): Promise<GeeReflectanceRecord | null>;
  };
  planetary: {
    searchSentinel2Scenes(r: GeeSceneSearchRequest): Promise<GeeSceneRecord[]>;
    getReflectanceAtPoint(r: GeeReflectanceRequest): Promise<GeeReflectanceRecord | null>;
  };
}

const defaultDeps: Sentinel2ProviderDeps = {
  order: getSatelliteProviderOrder,
  copernicusUsable: async () =>
    isCopernicusIntegrationEnabled() && (await satelliteCopernicusService.isLiveConnected()),
  planetaryUsable: isPlanetaryComputerEnabled,
  copernicus: {
    searchSentinel2Scenes: (r) => getCopernicusAdapter().searchSentinel2Scenes(r),
    getReflectanceAtPoint: (r) => getCopernicusAdapter().getReflectanceAtPoint(r),
  },
  planetary: planetaryAdapter,
};

export function createSentinel2Provider(deps: Sentinel2ProviderDeps = defaultDeps) {
  async function usable(provider: SatelliteProviderId): Promise<boolean> {
    return provider === "copernicus" ? deps.copernicusUsable() : deps.planetaryUsable();
  }

  return {
    /** Primer proveedor (en orden configurado) que devuelve escenas reales. */
    async searchScenes(request: GeeSceneSearchRequest): Promise<ProviderScenes | null> {
      for (const provider of deps.order()) {
        if (!(await usable(provider))) continue;
        try {
          const scenes = await deps[provider].searchSentinel2Scenes(request);
          const real = scenes.filter((s) => s.metadataSource !== "simulated");
          if (real.length > 0) return { provider, scenes: real };
        } catch {
          // falla de red/servicio: se intenta el siguiente proveedor
        }
      }
      return null;
    },

    /** Reflectancia del MISMO proveedor que entregó la escena. */
    async getReflectance(
      provider: SatelliteProviderId,
      request: GeeReflectanceRequest
    ): Promise<GeeReflectanceRecord | null> {
      try {
        return await deps[provider].getReflectanceAtPoint(request);
      } catch {
        return null;
      }
    },
  };
}

export const sentinel2Provider = createSentinel2Provider();

export const SATELLITE_PROVIDER_LABELS: Record<SatelliteProviderId, string> = {
  copernicus: "Copernicus Data Space (ESA)",
  planetary: "Microsoft Planetary Computer",
};
