/**
 * TrendAnalyzer — clasifica tendencias e interpreta evolución temporal.
 */

import type {
  HistoricalSeriesData,
  TemporalRecommendation,
  TrendDirection,
  TrendIndicatorData,
} from "@/types/temporal";
import { TREND_DIRECTION_LABELS, TREND_DIRECTION_SYMBOLS } from "@/types/temporal";
import type { TemporalStatisticsData } from "@/types/temporal";
import { getTemporalParameterConfig } from "./temporal.constants";

const STABLE_THRESHOLD = 0.08;

function computeSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

function classifyDirection(
  slope: number,
  range: number,
  higherIsBetter: boolean
): TrendDirection {
  const normalized = Math.abs(slope) / (range || 1);
  if (normalized < STABLE_THRESHOLD) return "stable";

  const isIncreasing = slope > 0;
  const isPositiveTrend = higherIsBetter ? isIncreasing : !isIncreasing;
  return isPositiveTrend ? "improving" : "worsening";
}

function buildInterpretation(
  parameterLabel: string,
  direction: TrendDirection,
  sampleCount: number,
  changePercent: number
): string {
  const countLabel = sampleCount >= 4 ? `${sampleCount} monitoreos` : "el periodo seleccionado";
  const paramRef =
    parameterLabel.toLowerCase() === "ph" ? "pH" : parameterLabel.toLowerCase();

  if (direction === "stable") {
    return `El parámetro ${parameterLabel} se mantiene estable durante ${countLabel}, sin variaciones significativas.`;
  }

  if (direction === "worsening") {
    const verb = changePercent >= 0 ? "creciente" : "decreciente";
    return `La ${paramRef} presenta una tendencia ${verb} durante los últimos ${countLabel}.`;
  }

  return `La ${paramRef} muestra una tendencia de mejora durante los últimos ${countLabel}.`;
}

function generateRecommendations(
  direction: TrendDirection,
  parameter: HistoricalSeriesData["parameter"]
): TemporalRecommendation[] {
  const base: TemporalRecommendation[] = [];

  if (direction === "stable") {
    base.push({
      id: "temp-rec-stable",
      priority: "low",
      text: "Continuar monitoreo mensual según plan de campaña.",
    });
  }

  if (direction === "worsening") {
    base.push({
      id: "temp-rec-frequency",
      priority: "medium",
      text: "Incrementar la frecuencia de monitoreo en la estación seleccionada.",
    });
    base.push({
      id: "temp-rec-inspect",
      priority: "medium",
      text: "Realizar inspección de fuentes contaminantes aguas arriba.",
    });
  }

  if (direction === "improving") {
    base.push({
      id: "temp-rec-maintain",
      priority: "low",
      text: "Mantener protocolo de monitoreo y documentar la tendencia positiva.",
    });
  }

  const parameterRecs: Partial<Record<HistoricalSeriesData["parameter"], TemporalRecommendation>> = {
    oxigenoDisuelto: {
      id: "temp-rec-do",
      priority: "high",
      text: "Evaluar posible déficit de oxigenación — revisar descargas orgánicas.",
    },
    turbidez: {
      id: "temp-rec-turb",
      priority: "medium",
      text: "Investigar incremento de sólidos en suspensión — erosión o vertidos.",
    },
    conductividad: {
      id: "temp-rec-cond",
      priority: "medium",
      text: "Analizar posibles aportes de sales o metales disueltos.",
    },
    ph: {
      id: "temp-rec-ph",
      priority: "medium",
      text: "Verificar equilibrio ácido-base — posible alteración química.",
    },
  };

  if (direction === "worsening" && parameterRecs[parameter]) {
    base.push(parameterRecs[parameter]!);
  }

  return base;
}

const DIRECTION_COLORS: Record<TrendDirection, string> = {
  improving: "text-emerald-600",
  stable: "text-slate-600",
  worsening: "text-red-600",
};

export class TrendAnalyzer {
  analyze(
    series: HistoricalSeriesData,
    stats: TemporalStatisticsData,
    previousStats: TemporalStatisticsData
  ): TrendIndicatorData {
    const config = getTemporalParameterConfig(series.parameter);
    const values = series.points.map((p) => p.value);
    const slope = computeSlope(values);
    const range = stats.maximum - stats.minimum || config.variance;
    const direction = classifyDirection(slope, range, config.higherIsBetter);
    const changePercent = previousStats.average
      ? Number(
          (((stats.average - previousStats.average) / Math.abs(previousStats.average)) * 100).toFixed(
            1
          )
        )
      : 0;

    return {
      direction,
      directionLabel: TREND_DIRECTION_LABELS[direction],
      directionSymbol: TREND_DIRECTION_SYMBOLS[direction],
      slope: Number(slope.toFixed(4)),
      changePercent,
      colorClass: DIRECTION_COLORS[direction],
      interpretation: buildInterpretation(
        config.label,
        direction,
        stats.sampleCount,
        changePercent
      ),
      recommendations: generateRecommendations(direction, series.parameter),
    };
  }
}

export const trendAnalyzer = new TrendAnalyzer();
