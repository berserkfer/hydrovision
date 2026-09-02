/**
 * Mappers — dominio mock/Prisma → SatelliteObservation
 */

import type { IndicesSatelitales } from "@/models/satellite";
import type { SatelliteIndex as PrismaSatelliteIndex } from "@prisma/client";
import {
  SENTINEL2_DEFAULT_COLLECTION,
  SENTINEL2_PLATFORM,
  SENTINEL2_PROCESSING_LEVEL,
} from "@/satellite/catalog/sentinel2-bands.catalog";
import { ESTIMATED_VARIABLE_DEFINITIONS } from "@/satellite/catalog/estimated-variables.catalog";
import type {
  EstimatedVariableValue,
  SatelliteObservation,
  SatellitePlatform,
  SatelliteScene,
} from "@/satellite/types/satellite-observation.types";
import { DEFAULT_CLOUD_MASK_REQUIREMENT } from "@/satellite/types/satellite-metadata.types";

const PRISMA_FUENTE_TO_PLATFORM: Record<string, SatellitePlatform> = {
  sentinel2: "sentinel2",
  landsat8: "landsat8",
  landsat9: "landsat9",
};

function buildPlaceholderEstimatedVariables(isSimulated: boolean): EstimatedVariableValue[] {
  return (Object.keys(ESTIMATED_VARIABLE_DEFINITIONS) as Array<
    keyof typeof ESTIMATED_VARIABLE_DEFINITIONS
  >).map((code) => ({
    code,
    value: null,
    unit: ESTIMATED_VARIABLE_DEFINITIONS[code].unit,
    derivationKind: ESTIMATED_VARIABLE_DEFINITIONS[code].derivationKind,
    isSimulated,
    status: "not_available" as const,
  }));
}

function mapPlatform(fuente: string): SatellitePlatform {
  return PRISMA_FUENTE_TO_PLATFORM[fuente] ?? "sentinel2";
}

export function mapMockIndicesToObservation(row: IndicesSatelitales): SatelliteObservation {
  const platform = mapPlatform(row.fuente);
  const acquisitionDate = row.fechaAdquisicion;

  return {
    id: row.id,
    stationId: row.estacionId,
    acquisitionDate,
    sensor: SENTINEL2_PLATFORM,
    platform,
    collection: SENTINEL2_DEFAULT_COLLECTION,
    sceneId: null,
    cloudPercentage: row.coberturaNubosa,
    bandsUsed: ["B03", "B04", "B08", "B11"],
    reflectances: undefined,
    indices: {
      NDWI: row.ndwi,
      NDVI: row.ndvi,
      MNDWI: row.mndwi,
      NDTI: row.ndti,
    },
    estimatedVariables: buildPlaceholderEstimatedVariables(true),
    source: platform,
    sourceType: "satellite",
    isSimulated: row.isSimulated,
    spatialResolutionMeters: 10,
    quality: {
      acquisitionDate,
      processingLevel: SENTINEL2_PROCESSING_LEVEL,
      cloudPercentage: row.coberturaNubosa,
      sceneId: null,
      sensor: SENTINEL2_PLATFORM,
      platform,
      collection: SENTINEL2_DEFAULT_COLLECTION,
      source: platform,
      isSimulated: true,
      spatialResolutionMeters: 10,
      bandsUsed: ["B03", "B04", "B08", "B11"],
      spatialRepresentativeness: "point_sampling",
      qualityNotes: DEFAULT_CLOUD_MASK_REQUIREMENT,
    },
    createdAt: row.createdAt,
  };
}

export function mapPrismaSatelliteIndexToObservation(row: PrismaSatelliteIndex): SatelliteObservation {
  const platform = mapPlatform(row.fuente);
  const acquisitionDate = row.fechaAdquisicion.toISOString().slice(0, 10);

  return {
    id: row.id,
    stationId: row.puntoMonitoreoId,
    acquisitionDate,
    sensor: SENTINEL2_PLATFORM,
    platform,
    collection: SENTINEL2_DEFAULT_COLLECTION,
    sceneId: row.tileId,
    cloudPercentage: row.coberturaNubosa,
    bandsUsed: ["B03", "B04", "B08", "B11"],
    reflectances: undefined,
    indices: {
      NDWI: row.ndwi,
      NDVI: row.ndvi,
      MNDWI: row.mndwi,
      NDTI: row.ndti,
    },
    estimatedVariables: buildPlaceholderEstimatedVariables(false),
    source: platform,
    sourceType: "satellite",
    isSimulated: false,
    spatialResolutionMeters: row.resolucionMetros,
    quality: {
      acquisitionDate,
      processingLevel: SENTINEL2_PROCESSING_LEVEL,
      cloudPercentage: row.coberturaNubosa,
      sceneId: row.tileId,
      sensor: SENTINEL2_PLATFORM,
      platform,
      collection: SENTINEL2_DEFAULT_COLLECTION,
      source: platform,
      isSimulated: false,
      spatialResolutionMeters: row.resolucionMetros,
      bandsUsed: ["B03", "B04", "B08", "B11"],
      spatialRepresentativeness: "point_sampling",
      qualityNotes: DEFAULT_CLOUD_MASK_REQUIREMENT,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapObservationToScene(observation: SatelliteObservation): SatelliteScene {
  return {
    sceneId: observation.sceneId ?? observation.id,
    stationId: observation.stationId,
    acquisitionDate: observation.acquisitionDate,
    platform: observation.platform,
    collection: observation.collection,
    cloudPercentage: observation.cloudPercentage,
    tileId: observation.sceneId,
    isSimulated: observation.isSimulated,
    sourceType: "satellite",
    bandsAvailable: observation.bandsUsed,
    previewUrl: null,
  };
}
