import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPrimarySatelliteProvider,
  getSatelliteProviderOrder,
} from "@/config/satellite-provider.config";
import type { GeeSceneRecord } from "@/server/gee/gee.adapter.types";
import { createSentinel2Provider, type Sentinel2ProviderDeps } from "./sentinel2-provider";

afterEach(() => {
  vi.unstubAllEnvs();
});

function scene(id: string, metadataSource: GeeSceneRecord["metadataSource"]): GeeSceneRecord {
  return {
    sceneId: id,
    systemIndex: id,
    acquisitionDate: "2026-10-01",
    cloudPercentage: 10,
    tileId: "T17MNN",
    collection: "sentinel-2-l2a",
    platform: "sentinel2",
    systemTimeStart: Date.parse("2026-10-01T15:00:00Z"),
    metadataSource,
    acquisitionFromSystemTime: true,
  };
}

const request = { latitude: -6.87, longitude: -79.93, startDate: "2026-09-25", endDate: "2026-10-05" };

function deps(overrides: Partial<Sentinel2ProviderDeps> = {}): Sentinel2ProviderDeps {
  return {
    order: () => ["copernicus", "planetary"],
    copernicusUsable: async () => true,
    planetaryUsable: () => true,
    copernicus: {
      searchSentinel2Scenes: vi.fn(async () => [scene("cdse-1", "copernicus_live")]),
      getReflectanceAtPoint: vi.fn(async () => null),
    },
    planetary: {
      searchSentinel2Scenes: vi.fn(async () => [scene("pc-1", "planetary_computer_live")]),
      getReflectanceAtPoint: vi.fn(async () => null),
    },
    ...overrides,
  };
}

describe("configuración del proveedor satelital", () => {
  it("usa Planetary Computer por defecto, con Copernicus como respaldo", () => {
    expect(getPrimarySatelliteProvider()).toBe("planetary");
    expect(getSatelliteProviderOrder()).toEqual(["planetary", "copernicus"]);
  });

  it("permite elegir Copernicus como principal", () => {
    vi.stubEnv("SATELLITE_PRIMARY_PROVIDER", "copernicus");
    expect(getSatelliteProviderOrder()).toEqual(["copernicus", "planetary"]);
  });

  it("sin respaldo consulta solo el principal", () => {
    vi.stubEnv("SATELLITE_PROVIDER_FALLBACK", "false");
    expect(getSatelliteProviderOrder()).toEqual(["planetary"]);
  });
});

describe("selector Sentinel-2", () => {
  it("sirve desde Copernicus cuando está disponible", async () => {
    const d = deps();
    const result = await createSentinel2Provider(d).searchScenes(request);
    expect(result?.provider).toBe("copernicus");
    expect(result?.scenes[0].sceneId).toBe("cdse-1");
    expect(d.planetary.searchSentinel2Scenes).not.toHaveBeenCalled();
  });

  it("sin credenciales o token real de Copernicus, usa Planetary Computer", async () => {
    const d = deps({ copernicusUsable: async () => false });
    const result = await createSentinel2Provider(d).searchScenes(request);
    expect(result?.provider).toBe("planetary");
    expect(d.copernicus.searchSentinel2Scenes).not.toHaveBeenCalled();
  });

  it("nunca entrega escenas simuladas de Copernicus como reales", async () => {
    const d = deps({
      copernicus: {
        searchSentinel2Scenes: vi.fn(async () => [scene("sim-cdse", "simulated")]),
        getReflectanceAtPoint: vi.fn(async () => null),
      },
    });
    const result = await createSentinel2Provider(d).searchScenes(request);
    expect(result?.provider).toBe("planetary");
    expect(result?.scenes.every((s) => s.metadataSource !== "simulated")).toBe(true);
  });

  it("si Copernicus falla por red, pasa al respaldo", async () => {
    const d = deps({
      copernicus: {
        searchSentinel2Scenes: vi.fn(async () => {
          throw new Error("timeout");
        }),
        getReflectanceAtPoint: vi.fn(async () => null),
      },
    });
    const result = await createSentinel2Provider(d).searchScenes(request);
    expect(result?.provider).toBe("planetary");
  });

  it("con respaldo desactivado y sin datos del principal devuelve null", async () => {
    const d = deps({
      order: () => ["copernicus"],
      copernicus: {
        searchSentinel2Scenes: vi.fn(async () => []),
        getReflectanceAtPoint: vi.fn(async () => null),
      },
    });
    expect(await createSentinel2Provider(d).searchScenes(request)).toBeNull();
    expect(d.planetary.searchSentinel2Scenes).not.toHaveBeenCalled();
  });

  it("lee la reflectancia del mismo proveedor que entregó la escena", async () => {
    const d = deps();
    const provider = createSentinel2Provider(d);
    await provider.getReflectance("planetary", { ...request, sceneId: "pc-1" });
    expect(d.planetary.getReflectanceAtPoint).toHaveBeenCalledTimes(1);
    expect(d.copernicus.getReflectanceAtPoint).not.toHaveBeenCalled();
  });
});
