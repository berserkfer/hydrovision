/**
 * Ejecutor de calibración exploratoria — regresión lineal simple.
 * Solo cuando readiness lo permite.
 */

import { getCandidateRelationshipsForParameter } from "../catalog/comparability.catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import {
  CALIBRATION_SCIENTIFIC_DISCLAIMERS,
} from "../config/calibration-readiness.config";
import type {
  CalibrationReadinessResult,
  ModelValidationStatus,
  ScientificCalibrationModel,
} from "../types/scientific-calibration.types";
import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import {
  evaluateParameterReadiness,
  isReadinessSufficientForCalibration,
} from "./calibration-readiness";
import { fitLinearRegression, predictLinear } from "./linear-regression";
import { computeRegressionMetrics } from "./regression-metrics";
import { getPredictorValueFromPair } from "./spectral-index-access";
import { splitPairsByTemporalOrder } from "./temporal-split";

export interface CalibrationRunInput {
  pairs: ScientificFieldSatellitePair[];
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
}

export interface CalibrationRunOutput {
  model: ScientificCalibrationModel | null;
  readiness: CalibrationReadinessResult;
  validationStatus: ModelValidationStatus;
  message?: string;
}

function buildWarnings(
  pairs: ScientificFieldSatellitePair[],
  trainingCount: number,
  validationCount: number,
  stationCount: number
): string[] {
  const warnings: string[] = [];

  if (pairs.length < 50) {
    warnings.push("Conjunto total pequeño para generalización");
  }
  if (validationCount < 10) {
    warnings.push("Conjunto de validación temporal pequeño");
  }
  if (stationCount === 1) {
    warnings.push("Modelo entrenado con una sola estación");
  }
  if (trainingCount < 20) {
    warnings.push("Conjunto de entrenamiento pequeño");
  }

  const values = pairs.map((p) => p.fieldValue);
  const range = Math.max(...values) - Math.min(...values);
  if (range < 1e-6) {
    warnings.push("Poca variabilidad en valores de campo");
  }

  return warnings;
}

export function runExploratoryCalibration(
  input: CalibrationRunInput
): CalibrationRunOutput {
  const { parameterCode, predictorIndex } = input;

  const candidates = getCandidateRelationshipsForParameter(parameterCode);
  const isCandidate = candidates.some((c) =>
    c.potentialExplanatoryIndices.includes(predictorIndex)
  );

  if (!isCandidate) {
    return {
      model: null,
      readiness: evaluateParameterReadiness([], parameterCode, predictorIndex),
      validationStatus: "failed",
      message: `Índice ${predictorIndex} no es candidato para ${parameterCode}`,
    };
  }

  const realPairs = input.pairs.filter(
    (p) =>
      !p.isSimulated &&
      p.sourceTypeField === "field" &&
      p.sourceTypeSatellite === "satellite" &&
      p.qualityStatus === "accepted" &&
      p.parameterCode === parameterCode
  );

  const pairsWithPredictor = realPairs.filter(
    (p) => getPredictorValueFromPair(p, predictorIndex) !== null
  );

  const readiness = evaluateParameterReadiness(realPairs, parameterCode, predictorIndex);

  if (!isReadinessSufficientForCalibration(readiness.status)) {
    return {
      model: null,
      readiness,
      validationStatus: "insufficient_data",
      message: readiness.reasons.join("; ") || readiness.status,
    };
  }

  const split = splitPairsByTemporalOrder(pairsWithPredictor);
  if (!split) {
    return {
      model: null,
      readiness,
      validationStatus: "insufficient_data",
      message: "Datos insuficientes para split temporal training/validation",
    };
  }

  const trainX = split.training.map((p) => getPredictorValueFromPair(p, predictorIndex)!);
  const trainY = split.training.map((p) => p.fieldValue);
  const valX = split.validation.map((p) => getPredictorValueFromPair(p, predictorIndex)!);
  const valY = split.validation.map((p) => p.fieldValue);

  const coefficients = fitLinearRegression(trainX, trainY);
  if (!coefficients) {
    return {
      model: null,
      readiness,
      validationStatus: "failed",
      message: "No se pudo ajustar regresión lineal (denominador cero o datos inválidos)",
    };
  }

  const trainPredicted = trainX.map((x) => predictLinear(coefficients, x));
  const valPredicted = valX.map((x) => predictLinear(coefficients, x));

  const trainingMetrics = computeRegressionMetrics(trainY, trainPredicted);
  const validationMetrics = computeRegressionMetrics(valY, valPredicted);

  const stationCount = new Set(pairsWithPredictor.map((p) => p.stationId)).size;
  const warnings = [...readiness.warnings, ...buildWarnings(
    pairsWithPredictor,
    split.training.length,
    split.validation.length,
    stationCount
  )];

  let validationStatus: ModelValidationStatus = "validated";
  if (!Number.isFinite(validationMetrics.r2) || split.validation.length === 0) {
    validationStatus = "failed";
  } else if (split.validation.length < 5) {
    validationStatus = "trained";
  }

  const disclaimer = [
    CALIBRATION_SCIENTIFIC_DISCLAIMERS.exploratory,
    CALIBRATION_SCIENTIFIC_DISCLAIMERS.r2,
    CALIBRATION_SCIENTIFIC_DISCLAIMERS.calibratedEstimate,
  ].join(" ");

  const model: ScientificCalibrationModel = {
    parameterCode,
    predictorIndex,
    modelType: "linear_regression",
    coefficientA: Number(coefficients.coefficientA.toFixed(6)),
    coefficientB: Number(coefficients.coefficientB.toFixed(6)),
    trainingSampleCount: split.training.length,
    validationSampleCount: split.validation.length,
    trainingMetrics,
    validationMetrics,
    temporalSplit: split.temporalSplit,
    stationCount,
    validationStatus,
    warnings,
    scientificStatus: "exploratory_calibration",
    disclaimer,
  };

  return { model, readiness, validationStatus };
}
