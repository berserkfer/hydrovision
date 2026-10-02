/**
 * SatelliteService — orquestación de la capa satelital + GEE/Copernicus/Planetary Computer.
 */

import { isSatelliteDatabaseEnabled } from "@/config/satellite-data-source.config";
import { isGeeIntegrationEnabled } from "@/config/gee-integration.config";
import { isCopernicusIntegrationEnabled } from "@/config/copernicus-integration.config";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { SENTINEL2_BANDS, SENTINEL2_BAND_CODES } from "@/satellite/catalog/sentinel2-bands.catalog";
import {
  SPECTRAL_INDEX_DEFINITIONS,
  SPECTRAL_INDEX_CODES,
} from "@/satellite/catalog/spectral-indices.catalog";
import {
  ESTIMATED_VARIABLE_DEFINITIONS,
  ESTIMATED_VARIABLE_CODES,
} from "@/satellite/catalog/estimated-variables.catalog";
import { CALIBRATION_MODEL_STUBS } from "@/satellite/types/calibration.types";
import type { SatelliteRepository } from "./satellite.repository";
import { satelliteMockRepository } from "./satellite.mock-repository";
import { satellitePrismaRepository } from "./satellite.prisma-repository";
import { satelliteGeeService } from "./satellite-gee.service";
import { satelliteCopernicusService } from "./satellite-copernicus.service";
import { satellitePlanetaryService } from "./satellite-planetary.service";
import type {
  SatelliteApiMeta,
  SatelliteCatalogResponse,
  SatelliteIndicesCatalogResponse,
  SatelliteObservationsResponse,
  SatelliteQueryFilters,
  SatelliteScenesResponse,
} from "./satellite.types";

function resolveRepository(): SatelliteRepository {
  return isSatelliteDatabaseEnabled() ? satellitePrismaRepository : satelliteMockRepository;
}

type ActiveSatelliteProvider = "none" | "gee" | "copernicus" | "planetary";

async function buildMeta(
  isSimulated: boolean,
  usedProvider: ActiveSatelliteProvider = "none"
): Promise<SatelliteApiMeta> {
  const dataSource = isSatelliteDatabaseEnabled() ? "database" : "mock";
  const geeConnected = isGeeIntegrationEnabled();
  const copernicusConnected = isCopernicusIntegrationEnabled();
  const planetaryConnected = isPlanetaryComputerEnabled();
  const geeLive = usedProvider === "gee" && geeConnected ? await satelliteGeeService.isLiveConnected() : false;
  const copernicusLive =
    usedProvider === "copernicus" && copernicusConnected
      ? await satelliteCopernicusService.isLiveConnected()
      : false;
  const planetaryLive =
    usedProvider === "planetary" && planetaryConnected
      ? await satellitePlanetaryService.isLiveConnected()
      : false;

  let providerStatus: SatelliteApiMeta["providerStatus"] =
    dataSource === "database" ? "database" : "mock";
  if (usedProvider === "copernicus" && copernicusConnected) {
    providerStatus = "copernicus";
  } else if (usedProvider === "gee" && geeConnected) {
    providerStatus = "gee";
  } else if (usedProvider === "planetary" && planetaryConnected) {
    providerStatus = "planetary_computer";
  }

  let message: string;
  if (usedProvider === "planetary" && planetaryLive) {
    message =
      "Observaciones REALES derivadas de Sentinel-2 L2A vía Microsoft Planetary Computer (catálogo público, sin credenciales).";
  } else if (usedProvider === "copernicus" && copernicusLive) {
    message = "Observaciones derivadas de consulta Sentinel-2 vía Copernicus Data Space Ecosystem.";
  } else if (usedProvider === "copernicus" && copernicusConnected) {
    message =
      "Copernicus configurado — datos con token simulado o fallback. Revise credenciales OAuth.";
  } else if (usedProvider === "gee" && geeLive) {
    message = "Observaciones derivadas de consulta Sentinel-2 vía Google Earth Engine.";
  } else if (usedProvider === "gee" && geeConnected) {
    message =
      "GEE configurado — datos con token simulado o fallback. Revise credenciales OAuth.";
  } else if (isSimulated) {
    message = "Datos satelitales simulados — no representan adquisición Sentinel-2 real.";
  } else {
    message = "Datos persistidos en PostgreSQL — índices sin calibración de campo.";
  }

  const isSimulatedResolved =
    usedProvider === "planetary"
      ? !planetaryLive
      : usedProvider === "copernicus"
        ? !copernicusLive
        : usedProvider === "gee"
          ? !geeLive
          : isSimulated;

  return {
    dataSource,
    sourceType: "satellite",
    isSimulated: isSimulatedResolved,
    providerStatus,
    geeConnected,
    geeLive,
    copernicusConnected,
    copernicusLive,
    planetaryConnected,
    planetaryLive,
    message,
  };
}

function shouldUseCopernicus(filters?: SatelliteQueryFilters): boolean {
  return Boolean(filters?.useCopernicus && isCopernicusIntegrationEnabled() && filters.stationId);
}

function shouldUseGee(filters?: SatelliteQueryFilters): boolean {
  return Boolean(filters?.useGee && isGeeIntegrationEnabled() && filters.stationId);
}

/**
 * Planetary Computer no requiere configuración de credenciales, así que además de su flag
 * explícito, se intenta automáticamente como respaldo cuando el caller pidió Copernicus/GEE
 * (quería datos reales) y esos no devolvieron nada — para no quedarse en `[]` pudiendo tener
 * un dato real gratuito disponible.
 */
function shouldUsePlanetary(filters?: SatelliteQueryFilters): boolean {
  if (!filters?.stationId || !isPlanetaryComputerEnabled()) return false;
  if (filters.usePlanetaryComputer) return true;
  return Boolean(filters.useCopernicus || filters.useGee);
}

export class SatelliteService {
  getDataSource(): "database" | "mock" {
    return resolveRepository().getDataSource();
  }

  async listObservations(filters?: SatelliteQueryFilters): Promise<SatelliteObservationsResponse> {
    if (shouldUseCopernicus(filters)) {
      const observations = await satelliteCopernicusService.queryObservationsFromCopernicus(filters);
      if (observations.length > 0) {
        return { observations, meta: await buildMeta(false, "copernicus") };
      }
    }

    if (shouldUseGee(filters)) {
      const geeObservations = await satelliteGeeService.queryObservationsFromGee(filters);
      if (geeObservations.length > 0) {
        return { observations: geeObservations, meta: await buildMeta(false, "gee") };
      }
    }

    if (shouldUsePlanetary(filters)) {
      const planetaryObservations = await satellitePlanetaryService.queryObservationsFromPlanetary(filters);
      if (planetaryObservations.length > 0) {
        return { observations: planetaryObservations, meta: await buildMeta(false, "planetary") };
      }
    }

    const repo = resolveRepository();
    const observations = await repo.findObservations(filters);
    const isSimulated = repo.getDataSource() === "mock" || observations.some((o) => o.isSimulated);
    return {
      observations,
      meta: await buildMeta(isSimulated),
    };
  }

  async getObservation(id: string) {
    const repo = resolveRepository();
    const observation = await repo.findObservationById(id);
    if (!observation) return null;
    return {
      observation,
      meta: await buildMeta(observation.isSimulated),
    };
  }

  async listScenes(filters?: SatelliteQueryFilters): Promise<SatelliteScenesResponse> {
    if (shouldUseCopernicus(filters)) {
      const scenes = await satelliteCopernicusService.queryScenesFromCopernicus(filters);
      if (scenes.length > 0) {
        return { scenes, meta: await buildMeta(false, "copernicus") };
      }
    }

    if (shouldUseGee(filters)) {
      const scenes = await satelliteGeeService.queryScenesFromGee(filters);
      if (scenes.length > 0) {
        return { scenes, meta: await buildMeta(false, "gee") };
      }
    }

    if (shouldUsePlanetary(filters)) {
      const scenes = await satellitePlanetaryService.queryScenesFromPlanetary(filters);
      if (scenes.length > 0) {
        return { scenes, meta: await buildMeta(false, "planetary") };
      }
    }

    const repo = resolveRepository();
    const scenes = await repo.findScenes(filters);
    const isSimulated = repo.getDataSource() === "mock" || scenes.some((s) => s.isSimulated);
    return {
      scenes,
      meta: await buildMeta(isSimulated),
    };
  }

  async getIndicesCatalog(): Promise<SatelliteIndicesCatalogResponse> {
    const isSimulated = !isSatelliteDatabaseEnabled();
    return {
      indices: SPECTRAL_INDEX_CODES.map((code) => SPECTRAL_INDEX_DEFINITIONS[code]),
      meta: await buildMeta(isSimulated),
    };
  }

  async getFullCatalog(): Promise<SatelliteCatalogResponse> {
    const isSimulated = !isSatelliteDatabaseEnabled();
    return {
      bands: SENTINEL2_BAND_CODES.map((code) => SENTINEL2_BANDS[code]),
      indices: SPECTRAL_INDEX_CODES.map((code) => SPECTRAL_INDEX_DEFINITIONS[code]),
      estimatedVariables: ESTIMATED_VARIABLE_CODES.map(
        (code) => ESTIMATED_VARIABLE_DEFINITIONS[code]
      ),
      calibrationModels: CALIBRATION_MODEL_STUBS,
      meta: await buildMeta(isSimulated),
    };
  }

  getGeeStatus() {
    return satelliteGeeService.getGeeStatus();
  }

  getCopernicusStatus() {
    return satelliteCopernicusService.getCopernicusStatus();
  }

  getPlanetaryStatus() {
    return satellitePlanetaryService.getPlanetaryStatus();
  }
}

export const satelliteService = new SatelliteService();
