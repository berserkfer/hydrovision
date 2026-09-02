/**
 * SatelliteService — orquestación de la capa satelital + GEE controlado.
 */

import { isSatelliteDatabaseEnabled } from "@/config/satellite-data-source.config";
import { isGeeIntegrationEnabled } from "@/config/gee-integration.config";
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

async function buildMeta(isSimulated: boolean, usedGee = false): Promise<SatelliteApiMeta> {
  const dataSource = isSatelliteDatabaseEnabled() ? "database" : "mock";
  const geeConnected = isGeeIntegrationEnabled();
  const geeLive = geeConnected ? await satelliteGeeService.isLiveConnected() : false;

  let providerStatus: SatelliteApiMeta["providerStatus"] =
    dataSource === "database" ? "database" : "mock";
  if (usedGee && geeConnected) {
    providerStatus = "gee";
  }

  let message: string;
  if (usedGee && geeLive) {
    message = "Observaciones derivadas de consulta Sentinel-2 vía Google Earth Engine.";
  } else if (usedGee && geeConnected) {
    message =
      "GEE configurado — datos con token simulado o fallback. Revise credenciales OAuth.";
  } else if (isSimulated) {
    message = "Datos satelitales simulados — no representan adquisición Sentinel-2 real.";
  } else {
    message = "Datos persistidos en PostgreSQL — índices sin calibración de campo.";
  }

  return {
    dataSource,
    sourceType: "satellite",
    isSimulated: usedGee ? !geeLive : isSimulated,
    providerStatus,
    geeConnected,
    geeLive,
    message,
  };
}

function shouldUseGee(filters?: SatelliteQueryFilters): boolean {
  return Boolean(filters?.useGee && isGeeIntegrationEnabled() && filters.stationId);
}

export class SatelliteService {
  getDataSource(): "database" | "mock" {
    return resolveRepository().getDataSource();
  }

  async listObservations(filters?: SatelliteQueryFilters): Promise<SatelliteObservationsResponse> {
    if (shouldUseGee(filters)) {
      const geeObservations = await satelliteGeeService.queryObservationsFromGee(filters);
      const meta = await buildMeta(false, true);
      return { observations: geeObservations, meta };
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
    if (shouldUseGee(filters)) {
      const scenes = await satelliteGeeService.queryScenesFromGee(filters);
      const meta = await buildMeta(false, true);
      return { scenes, meta };
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
}

export const satelliteService = new SatelliteService();
