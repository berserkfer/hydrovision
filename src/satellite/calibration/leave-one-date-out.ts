/**
 * Validación leave-one-date-out (LODO).
 *
 * Con pocos pares, un split 70/30 deja un conjunto de validación minúsculo y
 * un R² inestable. LODO entrena con todas las fechas menos una y valida con la
 * fecha excluida: mide generalización temporal y usa cada par exactamente una
 * vez como validación.
 *
 * Métrica principal: R², RMSE y MAE AGRUPADOS sobre todas las predicciones fuera
 * de muestra (una por par), con intervalo de confianza por bootstrap. Las métricas
 * por fecha se conservan como complemento: con 2–5 puntos por fecha, el R² de cada
 * fold es muy inestable (y puede ser muy negativo) y su media no es un buen resumen.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type {
  ScientificFieldSatellitePair,
} from "../types/scientific-dataset.types";
import type { RegressionMetrics } from "../types/scientific-calibration.types";
import { fitLinearRegression, predictLinear } from "./linear-regression";
import { computeMAE, computeR2, computeRMSE, computeRegressionMetrics } from "./regression-metrics";
import { getPredictorValueFromPair } from "./spectral-index-access";

export const MIN_LODO_TRAINING_PAIRS = 5;
/** Remuestreos bootstrap para el intervalo del R² agrupado. */
export const LODO_BOOTSTRAP_ITERATIONS = 2000;
/** Semilla fija: el intervalo es reproducible entre ejecuciones. */
export const LODO_BOOTSTRAP_SEED = 4000;
/** Por debajo de este N de predicciones fuera de muestra no se calcula intervalo. */
export const MIN_LODO_BOOTSTRAP_N = 5;

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

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: 0.95;
}

/** Métricas sobre TODAS las predicciones fuera de muestra, juntas. */
export interface LodoPooledMetrics {
  /** Número de predicciones fuera de muestra (pares validados). */
  n: number;
  r2: number | null;
  rmse: number | null;
  mae: number | null;
  /** IC 95 % percentil por bootstrap de pares; null si N < MIN_LODO_BOOTSTRAP_N. */
  r2Ci95: ConfidenceInterval | null;
  rmseCi95: ConfidenceInterval | null;
  bootstrapIterations: number;
  /** Remuestreos descartados por varianza nula del observado (R² indefinido). */
  bootstrapDegenerate: number;
}

export interface LeaveOneDateOutResult {
  strategy: "leave_one_date_out";
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
  folds: LodoFold[];
  evaluatedFolds: number;
  skippedFolds: number;
  /** Métrica principal. */
  pooled: LodoPooledMetrics;
  /** Complemento por fecha: media y desviación de los folds evaluados. */
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

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function ci95(samples: number[]): ConfidenceInterval | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    lower: Number(percentile(sorted, 0.025).toFixed(4)),
    upper: Number(percentile(sorted, 0.975).toFixed(4)),
    level: 0.95,
  };
}

/**
 * Métricas agrupadas + IC 95 % por bootstrap percentil (remuestreo de pares con
 * reemplazo). Exportada para pruebas.
 */
export function computePooledMetrics(
  predictions: Array<{ predicted: number; observed: number }>,
  options?: { iterations?: number; seed?: number }
): LodoPooledMetrics {
  const iterations = options?.iterations ?? LODO_BOOTSTRAP_ITERATIONS;
  const observed = predictions.map((p) => p.observed);
  const predicted = predictions.map((p) => p.predicted);
  const n = predictions.length;

  const base: LodoPooledMetrics = {
    n,
    r2: n >= 2 ? round(finiteOrNull(computeR2(observed, predicted))) : null,
    rmse: n >= 1 ? round(finiteOrNull(computeRMSE(observed, predicted))) : null,
    mae: n >= 1 ? round(finiteOrNull(computeMAE(observed, predicted))) : null,
    r2Ci95: null,
    rmseCi95: null,
    bootstrapIterations: 0,
    bootstrapDegenerate: 0,
  };

  if (n < MIN_LODO_BOOTSTRAP_N) return base;

  const rand = mulberry32(options?.seed ?? LODO_BOOTSTRAP_SEED);
  const r2Samples: number[] = [];
  const rmseSamples: number[] = [];
  let degenerate = 0;
  const obs = new Array<number>(n);
  const pred = new Array<number>(n);

  for (let b = 0; b < iterations; b += 1) {
    for (let i = 0; i < n; i += 1) {
      const k = Math.floor(rand() * n);
      obs[i] = observed[k];
      pred[i] = predicted[k];
    }
    rmseSamples.push(computeRMSE(obs, pred));
    const r2 = computeR2(obs, pred);
    if (Number.isFinite(r2)) r2Samples.push(r2);
    else degenerate += 1;
  }

  return {
    ...base,
    r2Ci95: ci95(r2Samples),
    rmseCi95: ci95(rmseSamples),
    bootstrapIterations: iterations,
    bootstrapDegenerate: degenerate,
  };
}

export function leaveOneDateOut(
  pairs: ScientificFieldSatellitePair[],
  parameterCode: ParametroCodigoDb,
  predictorIndex: SpectralIndexCode,
  options?: { minTrainingPairs?: number; bootstrapIterations?: number; bootstrapSeed?: number }
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

  const pooled = computePooledMetrics(allPredictions, {
    iterations: options?.bootstrapIterations,
    seed: options?.bootstrapSeed,
  });

  const note =
    evaluated.length === 0
      ? "No se pudo evaluar ninguna fecha: se requieren al menos dos fechas y suficiente entrenamiento."
      : [
          `Métrica principal: R², RMSE y MAE agrupados sobre las ${pooled.n} predicciones fuera de muestra.`,
          pooled.r2Ci95
            ? `IC 95 % por bootstrap percentil (${pooled.bootstrapIterations} remuestreos de pares, semilla fija).`
            : `Sin intervalo de confianza: se requieren al menos ${MIN_LODO_BOOTSTRAP_N} predicciones fuera de muestra.`,
          "El bootstrap remuestrea pares individuales; si los pares de una misma fecha están correlacionados, el intervalo puede subestimar la incertidumbre.",
          "Las métricas por fecha (media ± desviación) se reportan solo como complemento: con pocos puntos por fecha el R² de cada fold es inestable.",
        ].join(" ");

  return {
    strategy: "leave_one_date_out",
    parameterCode,
    predictorIndex,
    folds,
    evaluatedFolds: evaluated.length,
    skippedFolds: folds.length - evaluated.length,
    pooled,
    meanR2: round(meanR2),
    sdR2: round(sd(r2Values, meanR2)),
    meanRmse: round(mean(rmseValues)),
    meanMae: round(mean(maeValues)),
    pooledBias: round(pooledBias),
    note,
  };
}
