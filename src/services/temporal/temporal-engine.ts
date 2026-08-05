/**
 * TemporalEngine — orquestador del módulo de Análisis Temporal.
 * Punto de entrada desacoplado de la UI.
 */

import type {
  TemporalAnalysisFilters,
  TemporalAnalysisResult,
  TemporalChartPoint,
} from "@/types/temporal";
import { historicalSeries } from "./historical-series";
import { temporalStatistics } from "./temporal-statistics";
import { trendAnalyzer } from "./trend-analyzer";

function buildChartData(
  currentPoints: { date: string; label: string; value: number }[],
  previousPoints: { date: string; label: string; value: number }[]
): TemporalChartPoint[] {
  const maxLen = Math.max(currentPoints.length, previousPoints.length);

  return Array.from({ length: maxLen }, (_, i) => ({
    date: currentPoints[i]?.date ?? previousPoints[i]?.date ?? `point-${i}`,
    label: currentPoints[i]?.label ?? previousPoints[i]?.label ?? `P${i + 1}`,
    current: currentPoints[i]?.value ?? null,
    previous: previousPoints[i]?.value ?? null,
  }));
}

export class TemporalEngine {
  analyze(
    filters: TemporalAnalysisFilters,
    stationName: string
  ): TemporalAnalysisResult {
    const { stationId, parameter, startDate, endDate } = filters;

    const currentSeries = historicalSeries.build(
      stationId,
      stationName,
      parameter,
      startDate,
      endDate
    );

    const previousRange = historicalSeries.resolvePreviousRange(startDate, endDate);
    const previousSeries = historicalSeries.build(
      stationId,
      stationName,
      parameter,
      previousRange.start,
      previousRange.end
    );

    const currentStats = temporalStatistics.compute(currentSeries.points);
    const previousStats = temporalStatistics.compute(previousSeries.points);
    const trend = trendAnalyzer.analyze(currentSeries, currentStats, previousStats);

    return {
      filters,
      currentSeries,
      previousSeries,
      currentStats,
      previousStats,
      trend,
      chartData: buildChartData(currentSeries.points, previousSeries.points),
      evaluatedAt: new Date().toISOString(),
      isSimulated: true,
    };
  }
}

export const temporalEngine = new TemporalEngine();
