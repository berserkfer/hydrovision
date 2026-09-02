/**
 * Validación científica exploratoria de modelos calibrados.
 * TRAINED ≠ VALIDATED ≠ SCIENTIFICALLY_READY (máximo: validated_exploratory).
 */

import {
  CALIBRATION_SCIENTIFIC_DISCLAIMERS,
} from "../config/calibration-readiness.config";
import {
  CALIBRATION_VALIDATION_DISCLAIMERS,
  MIN_EXPLORATORY_VALIDATION,
  MIN_EXPLORATORY_VALIDATION_DISCLAIMER,
} from "../config/calibration-validation.config";
import type {
  ExploratoryValidationStatus,
  RobustnessStatus,
  ScientificCalibrationModel,
  ScientificCalibrationValidationExportRow,
  ScientificCalibrationValidationResult,
  StationCoverageEntry,
  TrainingValidationComparison,
} from "../types/scientific-calibration.types";
import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import { analyzeCalibrationDataQuality, detectExtremeOutliers, hasNonFiniteValue } from "./calibration-data-quality";
import { countIndependentTemporalPeriods } from "./temporal-split";

export interface ValidateCalibrationInput {
  model: ScientificCalibrationModel;
  pairs: ScientificFieldSatellitePair[];
  isSimulatedDataset?: boolean;
}

function coefficientSign(b: number): "positive" | "negative" | "zero" {
  if (b === 0) return "zero";
  return b > 0 ? "positive" : "negative";
}

function checkTemporalSplitFromModel(model: ScientificCalibrationModel): "passed" | "failed" {
  const trainEnd = model.temporalSplit.trainingPeriod.end;
  const valStart = model.temporalSplit.validationPeriod.start;
  return trainEnd < valStart ? "passed" : "failed";
}

function buildStationDistribution(
  pairs: ScientificFieldSatellitePair[]
): { distribution: StationCoverageEntry[]; dominantShare: number } {
  const total = pairs.length || 1;
  const counts = new Map<string, number>();
  for (const pair of pairs) {
    counts.set(pair.stationId, (counts.get(pair.stationId) ?? 0) + 1);
  }
  const distribution = Array.from(counts.entries())
    .map(([stationId, realPairs]) => ({
      stationId,
      realPairs,
      shareOfRealPairs: Number((realPairs / total).toFixed(4)),
    }))
    .sort((a, b) => b.realPairs - a.realPairs);

  const dominantShare = distribution.length > 0 ? distribution[0].shareOfRealPairs : 0;
  return { distribution, dominantShare };
}

function compareTrainingValidation(model: ScientificCalibrationModel): TrainingValidationComparison {
  const { trainingMetrics, validationMetrics } = model;
  const r2Gap =
    Number.isFinite(trainingMetrics.r2) && Number.isFinite(validationMetrics.r2)
      ? Number((trainingMetrics.r2 - validationMetrics.r2).toFixed(4))
      : null;

  const maeRatio =
    trainingMetrics.mae > 0 && Number.isFinite(validationMetrics.mae)
      ? Number((validationMetrics.mae / trainingMetrics.mae).toFixed(4))
      : null;

  const rmseRatio =
    trainingMetrics.rmse > 0 && Number.isFinite(validationMetrics.rmse)
      ? Number((validationMetrics.rmse / trainingMetrics.rmse).toFixed(4))
      : null;

  const possibleOverfittingSignal =
    (r2Gap !== null && r2Gap > MIN_EXPLORATORY_VALIDATION.maxR2GapWarning) ||
    (maeRatio !== null && maeRatio > MIN_EXPLORATORY_VALIDATION.maxMaeRatioWarning) ||
    (rmseRatio !== null && rmseRatio > MIN_EXPLORATORY_VALIDATION.maxRmseRatioWarning);

  return { r2Gap, maeRatio, rmseRatio, possibleOverfittingSignal };
}

function evaluateRobustness(
  model: ScientificCalibrationModel,
  comparison: TrainingValidationComparison
): RobustnessStatus {
  if (
    hasNonFiniteValue(
      model.coefficientA,
      model.coefficientB,
      model.trainingMetrics.mae,
      model.trainingMetrics.rmse,
      model.validationMetrics.mae,
      model.validationMetrics.rmse
    )
  ) {
    return "invalid";
  }

  if (
    model.validationSampleCount < MIN_EXPLORATORY_VALIDATION.minValidationPairs ||
    model.trainingSampleCount < MIN_EXPLORATORY_VALIDATION.minTrainingPairs
  ) {
    return "insufficient_data";
  }

  if (comparison.possibleOverfittingSignal) {
    return "warning";
  }

  return "robust_exploratory";
}

function resolveValidationStatus(
  model: ScientificCalibrationModel,
  temporalCheck: "passed" | "failed",
  isSimulatedDataset: boolean,
  robustness: RobustnessStatus,
  warnings: string[]
): ExploratoryValidationStatus {
  if (isSimulatedDataset) return "SIMULATED_DATA";
  if (temporalCheck === "failed") return "TEMPORAL_LEAKAGE";

  if (
    hasNonFiniteValue(model.coefficientA, model.coefficientB) ||
    robustness === "invalid"
  ) {
    return "INVALID_MODEL";
  }

  if (
    model.validationSampleCount < MIN_EXPLORATORY_VALIDATION.minValidationPairs ||
    model.validationStatus === "insufficient_data" ||
    robustness === "insufficient_data"
  ) {
    return "INSUFFICIENT_VALIDATION_DATA";
  }

  if (model.validationStatus === "failed" || model.validationStatus === "not_attempted") {
    return "NOT_VALIDATED";
  }

  if (model.validationStatus === "trained") {
    return "INSUFFICIENT_VALIDATION_DATA";
  }

  if (warnings.length > 0 || robustness === "warning") {
    return "VALIDATED_WITH_WARNINGS";
  }

  return "VALIDATED_EXPLORATORY";
}

export function validateCalibrationModel(
  input: ValidateCalibrationInput
): ScientificCalibrationValidationResult {
  const { model, pairs, isSimulatedDataset = false } = input;
  const warnings: string[] = [...model.warnings];

  const dataQuality = analyzeCalibrationDataQuality({
    allPairs: pairs,
    parameterCode: model.parameterCode,
    predictorIndex: model.predictorIndex,
  });

  const temporalLeakageCheck = checkTemporalSplitFromModel(model);
  if (temporalLeakageCheck === "failed") {
    warnings.push(
      `Leakage temporal: training termina ${model.temporalSplit.trainingPeriod.end}, validation inicia ${model.temporalSplit.validationPeriod.start}`
    );
  }

  if (hasNonFiniteValue(model.coefficientA, model.coefficientB)) {
    warnings.push("Coeficientes no finitos (NaN o Infinity)");
  }

  const comparison = compareTrainingValidation(model);
  if (comparison.possibleOverfittingSignal) {
    warnings.push(CALIBRATION_VALIDATION_DISCLAIMERS.possibleOverfitting);
  }

  const { distribution, dominantShare } = buildStationDistribution(
    pairs.filter(
      (p) =>
        !p.isSimulated &&
        p.qualityStatus === "accepted" &&
        p.parameterCode === model.parameterCode
    )
  );

  if (dominantShare > MIN_EXPLORATORY_VALIDATION.maxSingleStationShare) {
    warnings.push(
      `Estación dominante concentra ${(dominantShare * 100).toFixed(0)}% de pares — calibración depende excesivamente de una estación`
    );
  }

  if (model.stationCount < MIN_EXPLORATORY_VALIDATION.minStations) {
    warnings.push(
      `Solo ${model.stationCount} estación(es) — cobertura espacial limitada`
    );
  }

  const valDates = pairs
    .filter((p) => !p.isSimulated && p.parameterCode === model.parameterCode)
    .map((p) => p.fieldDate.slice(0, 10));
  const valPeriods = countIndependentTemporalPeriods(valDates);
  if (valPeriods < MIN_EXPLORATORY_VALIDATION.minValidationTemporalPeriods) {
    warnings.push("Cobertura temporal de validation limitada");
  }

  const fieldValues = pairs
    .filter((p) => p.parameterCode === model.parameterCode && Number.isFinite(p.fieldValue))
    .map((p) => p.fieldValue);
  const outliers = detectExtremeOutliers(fieldValues);
  if (outliers > 0) {
    warnings.push(`${outliers} valor(es) de campo con posible outlier extremo detectado(s)`);
  }

  const paramPairs = pairs.filter((p) => p.parameterCode === model.parameterCode);
  const largeTemporalDiff = paramPairs.filter(
    (p) => (p.temporalDifferenceDays ?? 0) > MIN_EXPLORATORY_VALIDATION.elevatedTemporalDiffDays
  ).length;
  if (paramPairs.length > 0 && largeTemporalDiff > paramPairs.length * 0.5) {
    warnings.push("Diferencias temporales campo-satélite elevadas en >50% de pares");
  }

  const robustnessStatus = evaluateRobustness(model, comparison);
  const validationStatus = resolveValidationStatus(
    model,
    temporalLeakageCheck,
    isSimulatedDataset,
    robustnessStatus,
    warnings
  );

  const disclaimer = [
    CALIBRATION_VALIDATION_DISCLAIMERS.validatedExploratory,
    CALIBRATION_VALIDATION_DISCLAIMERS.notScientificallyValidated,
    CALIBRATION_SCIENTIFIC_DISCLAIMERS.r2,
    MIN_EXPLORATORY_VALIDATION_DISCLAIMER,
  ].join(" ");

  return {
    parameterCode: model.parameterCode,
    predictorIndex: model.predictorIndex,
    modelType: model.modelType,
    coefficientA: model.coefficientA,
    coefficientB: model.coefficientB,
    coefficientSign: coefficientSign(model.coefficientB),
    trainingMetrics: model.trainingMetrics,
    validationMetrics: model.validationMetrics,
    trainingSampleCount: model.trainingSampleCount,
    validationSampleCount: model.validationSampleCount,
    trainingDateRange: model.temporalSplit.trainingPeriod,
    validationDateRange: model.temporalSplit.validationPeriod,
    temporalLeakageCheck,
    stationCount: model.stationCount,
    dominantStationShare: dominantShare,
    stationDistribution: distribution,
    trainingValidationComparison: comparison,
    dataQuality,
    modelTrainingStatus: model.validationStatus,
    validationStatus,
    robustnessStatus,
    warnings,
    scientificStatus: "validated_exploratory",
    disclaimer,
  };
}

export function toCalibrationValidationExportRow(
  model: ScientificCalibrationModel,
  validation: ScientificCalibrationValidationResult
): ScientificCalibrationValidationExportRow {
  return {
    parameter_code: model.parameterCode,
    predictor_index: model.predictorIndex,
    n_training: model.trainingSampleCount,
    n_validation: model.validationSampleCount,
    training_mae: model.trainingMetrics.mae,
    training_rmse: model.trainingMetrics.rmse,
    training_r2: model.trainingMetrics.r2,
    validation_mae: model.validationMetrics.mae,
    validation_rmse: model.validationMetrics.rmse,
    validation_r2: model.validationMetrics.r2,
    coefficient_a: model.coefficientA,
    coefficient_b: model.coefficientB,
    validation_status: validation.validationStatus,
    robustness_status: validation.robustnessStatus,
    warnings: validation.warnings.join(" | "),
  };
}

export function isValidationSuccessful(status: ExploratoryValidationStatus): boolean {
  return status === "VALIDATED_EXPLORATORY" || status === "VALIDATED_WITH_WARNINGS";
}
