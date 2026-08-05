/**
 * Servicio de estadísticas agregadas — Fase 5.
 */

import type { StatisticsQuery, StatisticsResult } from "@/types/reports";

export interface IStatisticsService {
  compute(query: StatisticsQuery): Promise<StatisticsResult>;
}

export class MockStatisticsService implements IStatisticsService {
  async compute(query: StatisticsQuery): Promise<StatisticsResult> {
    const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"];
    return {
      labels: months,
      series: [
        {
          name: "Oxígeno disuelto (prom.)",
          values: months.map((_, i) => Number((5.8 - i * 0.15).toFixed(2))),
        },
        {
          name: "Turbidez (prom.)",
          values: months.map((_, i) => Number((18 + i * 2.5).toFixed(1))),
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const statisticsService: IStatisticsService = new MockStatisticsService();
