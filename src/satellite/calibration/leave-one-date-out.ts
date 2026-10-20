/**
 * Validación leave-one-date-out (LODO).
 *
 * Con pocos pares, un split 70/30 deja un conjunto de validación minúsculo y
 * un R² inestable. LODO entrena con todas las fechas menos una y valida con la
 * fecha excluida: mide generalización temporal y usa cada par exactamente una
 * vez como validación.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type {
  ScientificFieldSatellitePair,
} from "../types/scientific-dataset.types";
import type { RegressionMetrics } from "../types/scientific-calibration.types";
import { fitLinearRegression, predictLinear } from "./linear-regression";
import { computeRegressionMetrics } from "./regression-metrics";
import { getPredictorValueFromPair } from "./spectral-index-access";

export const MIN_LODO_TRAINING_PAIRS = 5;

export type LodoFoldStatus =
  | "evaluated"
  | "skipped_insufficient_training"
  | "skipped_no_variation";

export interface LodoFold {
  heldOutDate: string;
  trainingCount: number;
  validationCount: number;
  status: LodoFoldStatus;
  metrics: RegressionMetrics | null;
  /** Media de (predicho − observado) en la fecha excluida. */
  bias: number | null;
}

export interface LeaveOneDateOutResult {
  strategy: "leave_one_date_out";
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
  folds: LodoFold[];
  evaluatedFolds: number;
  skippedFolds: number;
  meanR2: number | null;
  sdR2: number | null;
  meanRmse: number | null;
  meanMae: number | null;
  /** Sesgo agrupado de todas las predicciones out-of-fold. */
  pooledBias: number | null;
  note: string;
}

function finite(values: Array<number | null>): number[] {
  return values.filter((v): v is number => v !== null && Number.isFinite(v));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[], average: number | null): number | null {
  if (values.length < 2 || average === null) return null;
  const variance =
    values.reduce((acc, v) => acc + (v - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value: number | null): number | null {
  return value === null ? null : Number(value.toFixed(4));
}

export function leaveOneDateOut(
  pairs: ScientificFieldSatellitePair[],
  parameterCode: ParametroCodigoDb,
  predictorIndex: SpectralIndexCode,
  options?: { minTrainingPairs?: number }
): LeaveOneDateOutResult {
  const minTraining = options?.minTrainingPairs ?? MIN_LODO_TRAINING_PAIRS;

  const usable = pairs.filter(
    (p) =>
      p.parameterCode === parameterCode &&
      p.qualityStatus === "accepted" &&
      !p.isSimulated &&
      getPredictorValueFromPair(p, predictorIndex) !== null
  );

  const dates = [...new Set(usable.map((p) => p.fieldDate.slice(0, 10)))].sort();

  const folds: LodoFold[] = [];
  const allPredictions: Array<{ predicted: number; observed: number }> = [];

  for (const date of dates) {
    const validation = usable.filter((p) => p.fieldDate.slice(0, 10) === date);
    const training = usable.filter((p) => p.fieldDate.slice(0, 10) !== date);

    if (training.length < minTraining) {
      folds.push({
        heldOutDate: date,
        trainingCount: training.length,
        validationCount: validation.length,
        status: "skipped_insufficient_training",
        metrics: null,
        bias: null,
      });
      continue;
    }

    const trainingX: number[] = [];
    const trainingY: number[] = [];
    for (const pair of training) {
      const x = getPredictorValueFromPair(pair, predictorIndex);
      if (x === null) continue;
      trainingX.push(x);
      trainingY.push(pair.fieldValue);
    }

    const coefficients = fitLinearRegression(trainingX, trainingY);
    if (!coefficients) {
      folds.push({
        heldOutDate: date,
        trainingCount: training.length,
        validationCount: validation.length,
        status: "skipped_no_variation",
        metrics: null,
        bias: null,
      });
      continue;
    }

    const actual: number[] = [];
    const predicted: number[] = [];
    for (const pair of validation) {
      const x = getPredictorValueFromPair(pair, predictorIndex);
      if (x === null) continue;
      actual.push(pair.fieldValue);
      predicted.push(predictLinear(coefficients, x));
    }

    if (actual.length === 0) {
      folds.push({
        heldOutDate: date,
        trainingCount: training.length,
        validationCount: 0,
        status: "skipped_no_variation",
        metrics: null,
        bias: null,
      });
      continue;
    }

    for (let i = 0; i < actual.length; i += 1) {
      allPredictions.push({ predicted: predicted[i], observed: actual[i] });
    }

    const bias = mean(predicted.map((p, i) => p - actual[i]));

    folds.push({
      heldOutDate: date,
      trainingCount: training.length,
      validationCount: actual.length,
      status: "evaluated",
      metrics: computeRegressionMetrics(actual, predicted),
      bias: round(bias),
    });
  }

  const evaluated = folds.filter((f) => f.status === "evaluated");
  const r2Values = finite(evaluated.map((f) => f.metrics?.r2 ?? null));
  const rmseValues = finite(evaluated.map((f) => f.metrics?.rmse ?? null));
  const maeValues = finite(evaluated.map((f) => f.metrics?.mae ?? null));
  const meanR2 = mean(r2Values);

  const pooledBias = mean(
    allPredictions.map((p) => p.predicted - p.observed)
  );

  const note =
    evaluated.length === 0
      ? "No se pudo evaluar ninguna fecha: se requieren al menos dos fechas y suficiente entrenamiento."
      : "R² por fecha puede ser inestable con pocos puntos de validación; se reporta junto con RMSE, MAE y sesgo agrupado.";

  return {
    strategy: "leave_one_date_out",
    parameterCode,
    predictorIndex,
    folds,
    evaluatedFolds: evaluated.length,
    skippedFolds: folds.length - evaluated.length,
    meanR2: round(meanR2),
    sdR2: round(sd(r2Values, meanR2)),
    meanRmse: round(mean(rmseValues)),
    meanMae: round(mean(maeValues)),
    pooledBias: round(pooledBias),
    note,
  };
}
