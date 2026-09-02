/**
 * Control de calidad científico para pares campo ↔ satélite.
 * qualityStatus ≠ matchingStatus.
 * NO calcula correlaciones ni predicciones.
 */

import { PARAMETRO_CATALOG_BY_CODIGO } from "@/database/constants/parametros-catalog";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { FieldSatelliteMatchingStatus } from "../types/field-satellite-match.types";
import type {
  ScientificPairQualityStatus,
  SpectralIndicesSnapshot,
} from "../types/scientific-dataset.types";
import type { PixelQualityStatus } from "./pixel-quality";
import type { ReflectanceSemanticStatus } from "@/server/gee/gee-band.mapper";
import {
  isPixelContaminated,
  isPixelQualityAcceptableForIndices,
} from "./pixel-quality";

export interface QualityEvaluationInput {
  stationId: string;
  fieldSampleId: string;
  parameterCode: ParametroCodigoDb;
  fieldValue: number | null;
  fieldUnit: string;
  fieldDate: string;
  fieldIsSimulated: boolean;
  satelliteObservationId: string | null;
  satelliteIsSimulated: boolean;
  matchingStatus: FieldSatelliteMatchingStatus;
  operationallyCompatible: boolean;
  temporalDifferenceDays: number | null;
  distanceMeters: number | null;
  spectralIndices: SpectralIndicesSnapshot;
  /** null = desconocido — no tratar como 0% nubes */
  cloudPercentage: number | null;
  reflectanceSemanticStatus?: ReflectanceSemanticStatus | null;
  pixelQualityStatus?: PixelQualityStatus | null;
}

export interface QualityEvaluationResult {
  qualityStatus: ScientificPairQualityStatus;
  rejectionReason?: string;
  isSimulated: boolean;
}

function hasAnySpectralIndex(indices: SpectralIndicesSnapshot): boolean {
  return Object.values(indices).some((v) => v !== null && Number.isFinite(v));
}

function isValidParameterCode(code: string): code is ParametroCodigoDb {
  return code in PARAMETRO_CATALOG_BY_CODIGO;
}

export function mapIndicesToSnapshot(
  indices: Partial<Record<SpectralIndexCode, number>> | undefined
): SpectralIndicesSnapshot {
  const map = indices ?? {};
  const get = (code: SpectralIndexCode): number | null => {
    const value = map[code];
    return value === undefined ? null : value;
  };

  return {
    ndvi: get("NDVI"),
    ndci: get("NDCI"),
    ndwi: get("NDWI"),
    mndwi: get("MNDWI"),
    ndti: get("NDTI"),
    ndmi: get("NDMI"),
  };
}

/**
 * Evalúa si un par es apto para el dataset científico.
 * matchingStatus responde compatibilidad operativa; qualityStatus aptitud científica del par.
 */
export function evaluateScientificPairQuality(
  input: QualityEvaluationInput
): QualityEvaluationResult {
  const isSimulated = input.fieldIsSimulated || input.satelliteIsSimulated;

  if (!isValidParameterCode(input.parameterCode)) {
    return {
      qualityStatus: "invalid_measurement",
      rejectionReason: `Parámetro desconocido: ${input.parameterCode}`,
      isSimulated,
    };
  }

  if (input.fieldValue === null || !Number.isFinite(input.fieldValue)) {
    return {
      qualityStatus: "invalid_measurement",
      rejectionReason: "Valor de campo ausente o no numérico",
      isSimulated,
    };
  }

  if (!input.fieldUnit?.trim()) {
    return {
      qualityStatus: "invalid_measurement",
      rejectionReason: "Unidad de medición ausente",
      isSimulated,
    };
  }

  if (isSimulated) {
    return {
      qualityStatus: "simulated_data",
      rejectionReason: "Dato de campo o satélite simulado — no apto para dataset científico real",
      isSimulated: true,
    };
  }

  if (input.matchingStatus === "missing_field") {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: "Muestra de campo ausente",
      isSimulated: false,
    };
  }

  if (input.matchingStatus === "missing_satellite" || !input.satelliteObservationId) {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: "Observación satelital ausente",
      isSimulated: false,
    };
  }

  if (input.matchingStatus === "insufficient_data") {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: "Datos insuficientes para emparejamiento",
      isSimulated: false,
    };
  }

  if (input.matchingStatus === "temporal_mismatch") {
    return {
      qualityStatus: "temporal_mismatch",
      rejectionReason: `Diferencia temporal ${input.temporalDifferenceDays ?? "?"} d excede criterio operativo`,
      isSimulated: false,
    };
  }

  if (input.matchingStatus === "spatial_mismatch") {
    return {
      qualityStatus: "spatial_mismatch",
      rejectionReason: `Distancia ${input.distanceMeters ?? "?"} m excede criterio operativo`,
      isSimulated: false,
    };
  }

  if (input.cloudPercentage === null) {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: "Cobertura nubosa desconocida — no se asume 0%",
      isSimulated: false,
    };
  }

  if (input.reflectanceSemanticStatus && input.reflectanceSemanticStatus !== "valid") {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: `Reflectancia no válida (${input.reflectanceSemanticStatus}) — índices bloqueados`,
      isSimulated: false,
    };
  }

  if (input.pixelQualityStatus === "unknown" || input.pixelQualityStatus === undefined || input.pixelQualityStatus === null) {
    return {
      qualityStatus: "insufficient_data",
      rejectionReason: "Calidad de píxel (SCL) desconocida — no se marca como válida",
      isSimulated: false,
    };
  }

  const pixelQuality = input.pixelQualityStatus;

  if (isPixelContaminated(pixelQuality)) {
    return {
      qualityStatus: "rejected",
      rejectionReason: `Píxel contaminado (${pixelQuality}) — no apto para dataset`,
      isSimulated: false,
    };
  }

  if (!isPixelQualityAcceptableForIndices(pixelQuality)) {
    return {
      qualityStatus: "rejected",
      rejectionReason: `Calidad de píxel no apta (${pixelQuality})`,
      isSimulated: false,
    };
  }

  if (!hasAnySpectralIndex(input.spectralIndices)) {
    return {
      qualityStatus: "missing_index",
      rejectionReason: "Ningún índice espectral disponible (null — no rellenado con cero)",
      isSimulated: false,
    };
  }

  if (input.matchingStatus === "matched" && input.operationallyCompatible) {
    return {
      qualityStatus: "accepted",
      isSimulated: false,
    };
  }

  return {
    qualityStatus: "rejected",
    rejectionReason: `Matching no compatible: ${input.matchingStatus}`,
    isSimulated: false,
  };
}

export function isPairAcceptedForScientificDataset(
  qualityStatus: ScientificPairQualityStatus
): boolean {
  return qualityStatus === "accepted";
}
