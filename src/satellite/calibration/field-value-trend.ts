/**
 * Tendencia temporal de un parámetro de campo (valor ~ tiempo) — pura, sin I/O.
 * Distinta de exploratory-calibration.ts (que relaciona índice espectral ~ parámetro):
 * esta reconstruye la serie histórica real y proyecta a corto plazo, respondiendo a
 * "cómo evolucionó y hacia dónde va" en vez de "qué dice el satélite hoy".
 */

import {
  FIELD_TREND_DISCLAIMER,
  MAX_TREND_FORECAST_HORIZON_DAYS,
  MIN_TREND_DISTINCT_DATES,
  MIN_TREND_POINTS,
} from "../config/field-trend.config";
import { fitLinearRegression, predictLinear } from "./linear-regression";
import { computeRegressionMetrics } from "./regression-metrics";
import type { RegressionMetrics } from "../types/scientific-calibration.types";

export interface FieldTrendInputPoint {
  date: string; // ISO
  value: number;
  sampleId: string;
  isSimulated: boolean;
}

export type FieldTrendStatus = "TREND_AVAILABLE" | "INSUFFICIENT_TEMPORAL_DATA";

export interface FieldTrendForecast {
  horizonDays: number;
  targetDate: string;
  predictedValue: number;
  uncertainty: { lower: number; upper: number; method: string };
}

export interface FieldTrendResult {
  status: FieldTrendStatus;
  points: FieldTrendInputPoint[];
  distinctDates: number;
  dateRange: { start: string; end: string } | null;
  trend: {
    slopePerDay: number;
    slopePerYear: number;
    intercept: number;
    metrics: RegressionMetrics;
    referenceDate: string;
  } | null;
  forecast: FieldTrendForecast | null;
  reasons: string[];
  disclaimer: string;
}

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;
const UNCERTAINTY_METHOD =
  "±RMSE del ajuste histórico (heurístico, no es un intervalo de confianza estadístico)";

function daysBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / DAY_MS;
}

/**
 * Ajusta value ~ time sobre puntos reales (NUNCA simulados — filtrar antes de llamar
 * si el caller mezcla fuentes) y, si el ajuste es suficiente, proyecta un horizonte corto.
 */
export function computeFieldValueTrend(
  points: FieldTrendInputPoint[],
  forecastHorizonDays: number = 90
): FieldTrendResult {
  const sorted = [...points].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const distinctDates = new Set(sorted.map((p) => p.date.slice(0, 10))).size;
  const dateRange =
    sorted.length > 0
      ? { start: sorted[0].date.slice(0, 10), end: sorted[sorted.length - 1].date.slice(0, 10) }
      : null;

  const reasons: string[] = [];
  if (sorted.length < MIN_TREND_POINTS) {
    reasons.push(`Solo ${sorted.length} punto(s) real(es) (mínimo ${MIN_TREND_POINTS})`);
  }
  if (distinctDates < MIN_TREND_DISTINCT_DATES) {
    reasons.push(
      `Solo ${distinctDates} fecha(s) distinta(s) (mínimo ${MIN_TREND_DISTINCT_DATES}) — 2 fechas ajustan una recta perfecta sin significado estadístico`
    );
  }

  if (reasons.length > 0) {
    return {
      status: "INSUFFICIENT_TEMPORAL_DATA",
      points: sorted,
      distinctDates,
      dateRange,
      trend: null,
      forecast: null,
      reasons,
      disclaimer: FIELD_TREND_DISCLAIMER,
    };
  }

  const referenceDate = sorted[0].date;
  const x = sorted.map((p) => daysBetween(referenceDate, p.date));
  const y = sorted.map((p) => p.value);

  const coefficients = fitLinearRegression(x, y);
  if (!coefficients) {
    return {
      status: "INSUFFICIENT_TEMPORAL_DATA",
      points: sorted,
      distinctDates,
      dateRange,
      trend: null,
      forecast: null,
      reasons: ["No se pudo ajustar una tendencia (varianza temporal insuficiente)"],
      disclaimer: FIELD_TREND_DISCLAIMER,
    };
  }

  const predicted = x.map((xi) => predictLinear(coefficients, xi));
  const metrics = computeRegressionMetrics(y, predicted);

  const clampedHorizon = Math.min(forecastHorizonDays, MAX_TREND_FORECAST_HORIZON_DAYS);
  const lastX = x[x.length - 1];
  const forecastX = lastX + clampedHorizon;
  const forecastValueRaw = predictLinear(coefficients, forecastX);
  const targetDate = new Date(Date.parse(referenceDate) + forecastX * DAY_MS)
    .toISOString()
    .slice(0, 10);

  const forecast: FieldTrendForecast | null = Number.isFinite(metrics.rmse)
    ? {
        horizonDays: clampedHorizon,
        targetDate,
        predictedValue: Number(forecastValueRaw.toFixed(4)),
        uncertainty: {
          lower: Number((forecastValueRaw - metrics.rmse).toFixed(4)),
          upper: Number((forecastValueRaw + metrics.rmse).toFixed(4)),
          method: UNCERTAINTY_METHOD,
        },
      }
    : null;

  return {
    status: "TREND_AVAILABLE",
    points: sorted,
    distinctDates,
    dateRange,
    trend: {
      slopePerDay: Number(coefficients.coefficientB.toFixed(6)),
      slopePerYear: Number((coefficients.coefficientB * YEAR_DAYS).toFixed(4)),
      intercept: Number(coefficients.coefficientA.toFixed(6)),
      metrics,
      referenceDate,
    },
    forecast,
    reasons: [],
    disclaimer: FIELD_TREND_DISCLAIMER,
  };
}
