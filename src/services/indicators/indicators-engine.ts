/**
 * IndicatorsEngine — orquestador del Environmental Indicators Engine.
 */

import type { DashboardStats, StationSummary } from "@/types";
import type { IndicatorQueryOptions, IndicatorsEngineResult } from "@/types/indicators";
import { indicatorCalculator } from "./indicator-calculator";
import { indicatorRepository } from "./indicator.repository";
import { indicatorService } from "./indicator.service";

export interface IndicatorsEngineInput {
  stats: DashboardStats;
  summaries: StationSummary[];
  riverId: string;
  query?: IndicatorQueryOptions;
}

export class IndicatorsEngine {
  evaluate(input: IndicatorsEngineInput): IndicatorsEngineResult {
    const all = indicatorCalculator.calculateAll(
      input.stats,
      input.summaries,
      input.riverId
    );

    const query = input.query ?? {
      search: "",
      category: "all",
      status: "all",
      sortBy: "score",
      sortOrder: "desc",
      groupByCategory: true,
    };

    return indicatorService.query(all, query);
  }

  getCategories() {
    return indicatorRepository.getCategories();
  }

  getCatalog() {
    return indicatorRepository.getCatalog();
  }
}

export const indicatorsEngine = new IndicatorsEngine();
