/**
 * Calibración local del módulo de foto (Nivel 3) — reutiliza el mismo OLS y las mismas
 * métricas que el resto de la plataforma (satélite, modelo ambiental), y el mismo umbral
 * mínimo YA definido en el proyecto para regresiones de campo: N≥4 puntos, ≥3 fechas
 * distintas (src/satellite/config/field-trend.config.ts) — instrucción explícita del
 * usuario de reutilizar ese mínimo en vez de definir uno nuevo.
 */

import { fitLinearRegression, predictLinear } from "@/satellite/calibration/linear-regression";
import { computeRegressionMetrics } from "@/satellite/calibration/regression-metrics";
import type { RegressionMetrics } from "@/satellite/types/scientific-calibration.types";
import {
  MIN_TREND_DISTINCT_DATES,
  MIN_TREND_POINTS,
} from "@/satellite/config/field-trend.config";
import {
  listPhotoCalibrationPairs,
  type PhotoCalibrationParameterCode,
} from "./photo-calibration.store";

export interface PhotoCalibrationModel {
  coefficientA: number;
  coefficientB: number;
  metrics: RegressionMetrics;
}

export interface PhotoCalibrationStatus {
  parameterCode: PhotoCalibrationParameterCode;
  n: number;
  distinctDates: number;
  minPointsRequired: number;
  minDistinctDatesRequired: number;
  sufficient: boolean;
  model: PhotoCalibrationModel | null;
  validRange: { min: number; max: number } | null;
  message: string;
}

export function evaluatePhotoCalibration(
  parameterCode: PhotoCalibrationParameterCode
): PhotoCalibrationStatus {
  const pairs = listPhotoCalibrationPairs(parameterCode);
  const n = pairs.length;
  const distinctDates = new Set(pairs.map((p) => p.labDate.slice(0, 10))).size;
  const sufficient = n >= MIN_TREND_POINTS && distinctDates >= MIN_TREND_DISTINCT_DATES;

  const base = {
    parameterCode,
    n,
    distinctDates,
    minPointsRequired: MIN_TREND_POINTS,
    minDistinctDatesRequired: MIN_TREND_DISTINCT_DATES,
  };

  if (!sufficient) {
    return {
      ...base,
      sufficient: false,
      model: null,
      validRange: null,
      message: `N=${n} par(es) real(es) (mínimo ${MIN_TREND_POINTS}), ${distinctDates} fecha(s) distinta(s) (mínimo ${MIN_TREND_DISTINCT_DATES}) — insuficiente para calibrar. Se usa la fórmula genérica de HydroColor mientras tanto.`,
    };
  }

  const x = pairs.map((p) => p.rrsRed);
  const y = pairs.map((p) => p.labValue);
  const coefficients = fitLinearRegression(x, y);

  if (!coefficients) {
    return {
      ...base,
      sufficient: false,
      model: null,
      validRange: null,
      message: "No se pudo ajustar una regresión (varianza nula en Rrs entre los pares disponibles).",
    };
  }

  const predicted = x.map((xi) => predictLinear(coefficients, xi));
  const metrics = computeRegressionMetrics(y, predicted);

  return {
    ...base,
    sufficient: true,
    model: { coefficientA: coefficients.coefficientA, coefficientB: coefficients.coefficientB, metrics },
    validRange: { min: Math.min(...x), max: Math.max(...x) },
    message: `Calibrado con N=${n} pares de laboratorio — R²=${metrics.r2}, RMSE=${metrics.rmse}, MAE=${metrics.mae}.`,
  };
}

export interface PhotoCalibratedPrediction {
  value: number;
  outOfRange: boolean;
  status: PhotoCalibrationStatus;
}

/** Retorna null si no hay calibración suficiente — nunca fabrica un valor "calibrado" falso. */
export function predictWithPhotoCalibration(
  parameterCode: PhotoCalibrationParameterCode,
  rrsRed: number
): PhotoCalibratedPrediction | null {
  const status = evaluatePhotoCalibration(parameterCode);
  if (!status.sufficient || !status.model || !status.validRange) return null;

  const value = predictLinear(
    { coefficientA: status.model.coefficientA, coefficientB: status.model.coefficientB },
    rrsRed
  );
  const outOfRange = rrsRed < status.validRange.min || rrsRed > status.validRange.max;

  return { value: Number(value.toFixed(4)), outOfRange, status };
}
