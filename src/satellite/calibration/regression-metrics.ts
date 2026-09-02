/**
 * Métricas de regresión — MAE, RMSE, R².
 * R² NO implica causalidad.
 */

import type { RegressionMetrics } from "../types/scientific-calibration.types";

export function computeMAE(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return NaN;
  const sum = actual.reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
  return sum / actual.length;
}

export function computeRMSE(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return NaN;
  const sumSq = actual.reduce((acc, val, i) => {
    const diff = val - predicted[i];
    return acc + diff * diff;
  }, 0);
  return Math.sqrt(sumSq / actual.length);
}

export function computeR2(actual: number[], predicted: number[]): number {
  if (actual.length < 2 || actual.length !== predicted.length) return NaN;

  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < actual.length; i += 1) {
    ssTot += (actual[i] - mean) ** 2;
    ssRes += (actual[i] - predicted[i]) ** 2;
  }

  if (ssTot === 0) return NaN;
  return 1 - ssRes / ssTot;
}

export function computeRegressionMetrics(
  actual: number[],
  predicted: number[]
): RegressionMetrics {
  return {
    mae: Number(computeMAE(actual, predicted).toFixed(4)),
    rmse: Number(computeRMSE(actual, predicted).toFixed(4)),
    r2: Number(computeR2(actual, predicted).toFixed(4)),
  };
}
