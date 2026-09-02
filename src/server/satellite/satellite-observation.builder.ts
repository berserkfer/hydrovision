/**
 * Construye SatelliteObservation desde datos GEE + índices HydroVision.
 * Las fórmulas viven en spectral-indices.catalog — NO en el adaptador GEE.
 */

import {
  SENTINEL2_PLATFORM,
  SENTINEL2_PROCESSING_LEVEL,
} from "@/satellite/catalog/sentinel2-bands.catalog";
import {
  computeSpectralIndex,
  SPECTRAL_INDEX_CODES,
  type SpectralIndexCode,
} from "@/satellite/catalog/spectral-indices.catalog";
import { ESTIMATED_VARIABLE_DEFINITIONS } from "@/satellite/catalog/estimated-variables.catalog";
import type {
  EstimatedVariableValue,
  SatelliteObservation,
  SpectralIndexValues,
} from "@/satellite/types/satellite-observation.types";
import { DEFAULT_CLOUD_MASK_REQUIREMENT, POINT_SAMPLING_LIMITATION } from "@/satellite/types/satellite-metadata.types";
import type { GeeReflectanceRecord, GeeSceneRecord } from "@/server/gee/gee.adapter.types";

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

function computeIndicesFromReflectance(
  reflectances: GeeReflectanceRecord["reflectances"]
): SpectralIndexValues {
  const indices: SpectralIndexValues = {};
  const computable: SpectralIndexCode[] = ["NDVI", "NDCI", "NDWI", "MNDWI", "NDTI", "NDMI"];

  for (const code of computable) {
    const value = computeSpectralIndex(code, reflectances);
    if (value !== null) {
      indices[code] = value;
    }
  }

  return indices;
}

export interface BuildObservationInput {
  stationId: string;
  scene: GeeSceneRecord;
  reflectance: GeeReflectanceRecord;
  isSimulated: boolean;
}

export function buildSatelliteObservationFromGee(
  input: BuildObservationInput
): SatelliteObservation {
  const { stationId, scene, reflectance, isSimulated } = input;
  const indices = computeIndicesFromReflectance(reflectance.reflectances);
  const acquisitionDate = scene.acquisitionDate.slice(0, 10);
  const id = `gee-${stationId}-${scene.sceneId}`;

  return {
    id,
    stationId,
    acquisitionDate,
    sensor: SENTINEL2_PLATFORM,
    platform: "sentinel2",
    collection: scene.collection,
    sceneId: scene.sceneId,
    cloudPercentage: scene.cloudPercentage,
    bandsUsed: reflectance.bandsUsed,
    reflectances: reflectance.reflectances,
    indices,
    estimatedVariables: buildPlaceholderEstimatedVariables(isSimulated),
    source: "sentinel2",
    sourceType: "satellite",
    isSimulated,
    spatialResolutionMeters: 10,
    quality: {
      acquisitionDate,
      processingLevel: SENTINEL2_PROCESSING_LEVEL,
      cloudPercentage: reflectance.cloudPercentage ?? scene.cloudPercentage,
      sceneId: scene.sceneId,
      sensor: SENTINEL2_PLATFORM,
      platform: "sentinel2",
      collection: scene.collection,
      source: "sentinel2",
      isSimulated,
      spatialResolutionMeters: 10,
      bandsUsed: reflectance.bandsUsed,
      spatialRepresentativeness: reflectance.spatialRepresentativeness,
      reflectanceSemanticStatus: reflectance.reflectanceSemanticStatus,
      scaleEvidence: reflectance.scaleEvidence,
      pixelQualityStatus: reflectance.pixelQualityStatus,
      sclRawValue: reflectance.sclRawValue,
      systemTimeStart: reflectance.systemTimeStart ?? scene.systemTimeStart ?? null,
      tileId: scene.tileId,
      qualityNotes: `${DEFAULT_CLOUD_MASK_REQUIREMENT} ${POINT_SAMPLING_LIMITATION}`,
    },
    createdAt: new Date().toISOString(),
  };
}

/** Verifica que los índices se calculan con el catálogo HydroVision */
export function getSupportedIndexCodesForGee(): SpectralIndexCode[] {
  return SPECTRAL_INDEX_CODES.filter((code) =>
    ["NDVI", "NDCI", "NDWI", "MNDWI", "NDTI", "NDMI"].includes(code)
  );
}
