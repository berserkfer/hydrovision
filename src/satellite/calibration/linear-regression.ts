/**
 * Regresión lineal simple: y = a + b*x
 * OLS transparente — sin dependencias externas.
 */

export interface LinearRegressionCoefficients {
  coefficientA: number;
  coefficientB: number;
}

export function fitLinearRegression(
  x: number[],
  y: number[]
): LinearRegressionCoefficients | null {
  if (x.length !== y.length || x.length < 2) return null;

  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i += 1) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const coefficientB = (n * sumXY - sumX * sumY) / denominator;
  const coefficientA = (sumY - coefficientB * sumX) / n;

  return { coefficientA, coefficientB };
}

export function predictLinear(coefficients: LinearRegressionCoefficients, x: number): number {
  return coefficients.coefficientA + coefficients.coefficientB * x;
}

/** Etiqueta de salida calibrada — sourceType model */
export interface CalibratedFieldEstimate {
  predictedFieldValue: number;
  sourceType: "model";
  label: "calibrated estimate";
  disclaimer: string;
}

export function toCalibratedEstimate(
  coefficients: LinearRegressionCoefficients,
  predictorValue: number,
  disclaimer: string
): CalibratedFieldEstimate {
  return {
    predictedFieldValue: predictLinear(coefficients, predictorValue),
    sourceType: "model",
    label: "calibrated estimate",
    disclaimer,
  };
}
