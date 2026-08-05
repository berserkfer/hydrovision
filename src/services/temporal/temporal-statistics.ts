/**
 * TemporalStatistics — calcula estadísticas descriptivas de una serie temporal.
 */

import type { TemporalDataPoint, TemporalStatisticsData } from "@/types/temporal";

export class TemporalStatistics {
  compute(points: TemporalDataPoint[]): TemporalStatisticsData {
    if (points.length === 0) {
      return {
        average: 0,
        maximum: 0,
        minimum: 0,
        standardDeviation: 0,
        sampleCount: 0,
      };
    }

    const values = points.map((p) => p.value);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const average = sum / values.length;
    const maximum = Math.max(...values);
    const minimum = Math.min(...values);

    const variance =
      values.reduce((acc, v) => acc + (v - average) ** 2, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average: Number(average.toFixed(2)),
      maximum: Number(maximum.toFixed(2)),
      minimum: Number(minimum.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      sampleCount: values.length,
    };
  }

  computeChangePercent(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  }
}

export const temporalStatistics = new TemporalStatistics();
