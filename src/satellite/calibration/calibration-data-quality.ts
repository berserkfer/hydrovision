/**
 * Detección de datos problemáticos — sin imputación ni reemplazo de null por 0.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { DataDiscardReasons, DataQualityReport } from "../types/scientific-calibration.types";
import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import { getPredictorValueFromPair } from "./spectral-index-access";

export interface DataQualityInput {
  allPairs: ScientificFieldSatellitePair[];
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
}

function emptyReasons(): DataDiscardReasons {
  return {
    simulated: 0,
    nullPredictor: 0,
    invalidFieldValue: 0,
    duplicate: 0,
    notAccepted: 0,
    wrongParameter: 0,
  };
}

export function analyzeCalibrationDataQuality(input: DataQualityInput): DataQualityReport {
  const { allPairs, parameterCode, predictorIndex } = input;
  const discardReasons = emptyReasons();
  const seen = new Set<string>();
  let effective = 0;

  for (const pair of allPairs) {
    if (pair.parameterCode !== parameterCode) {
      discardReasons.wrongParameter += 1;
      continue;
    }
    if (pair.isSimulated) {
      discardReasons.simulated += 1;
      continue;
    }
    if (pair.qualityStatus !== "accepted") {
      discardReasons.notAccepted += 1;
      continue;
    }
    if (!Number.isFinite(pair.fieldValue)) {
      discardReasons.invalidFieldValue += 1;
      continue;
    }

    const key = `${pair.fieldMeasurementId}::${pair.satelliteObservationId ?? "none"}`;
    if (seen.has(key)) {
      discardReasons.duplicate += 1;
      continue;
    }
    seen.add(key);

    const predictor = getPredictorValueFromPair(pair, predictorIndex);
    if (predictor === null || !Number.isFinite(predictor)) {
      discardReasons.nullPredictor += 1;
      continue;
    }

    effective += 1;
  }

  const discardedCount =
    discardReasons.simulated +
    discardReasons.nullPredictor +
    discardReasons.invalidFieldValue +
    discardReasons.duplicate +
    discardReasons.notAccepted +
    discardReasons.wrongParameter;

  return {
    totalInputPairs: allPairs.length,
    effectiveObservationsUsed: effective,
    discardedCount,
    discardReasons,
  };
}

export function hasNonFiniteValue(...values: number[]): boolean {
  return values.some((v) => !Number.isFinite(v));
}

export function detectExtremeOutliers(values: number[], zThreshold = 3): number {
  if (values.length < 3) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return values.filter((v) => Math.abs((v - mean) / std) > zThreshold).length;
}
