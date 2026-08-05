/**
 * IndicatorService — filtrado, ordenamiento, búsqueda y agrupación.
 */

import type {
  Indicator,
  IndicatorGroup,
  IndicatorQueryOptions,
  IndicatorsEngineResult,
} from "@/types/indicators";
import { INDICATOR_CATEGORY_LABELS } from "@/types/indicators";
import { IMPORTANCE_WEIGHT } from "./indicator.constants";

function matchesSearch(indicator: Indicator, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    indicator.name.toLowerCase().includes(q) ||
    indicator.description.toLowerCase().includes(q) ||
    indicator.categoryLabel.toLowerCase().includes(q)
  );
}

function sortIndicators(indicators: Indicator[], options: IndicatorQueryOptions): Indicator[] {
  const sorted = [...indicators];

  sorted.sort((a, b) => {
    let cmp = 0;
    switch (options.sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name, "es");
        break;
      case "score":
        cmp = a.score - b.score;
        break;
      case "importance":
        cmp = IMPORTANCE_WEIGHT[a.importance] - IMPORTANCE_WEIGHT[b.importance];
        break;
      case "category":
        cmp = a.categoryLabel.localeCompare(b.categoryLabel, "es");
        break;
    }
    return options.sortOrder === "asc" ? cmp : -cmp;
  });

  return sorted;
}

function groupByCategory(indicators: Indicator[]): IndicatorGroup[] {
  const map = new Map<string, Indicator[]>();

  for (const ind of indicators) {
    const list = map.get(ind.category) ?? [];
    list.push(ind);
    map.set(ind.category, list);
  }

  return Array.from(map.entries()).map(([category, items]) => ({
    category: category as IndicatorGroup["category"],
    categoryLabel: INDICATOR_CATEGORY_LABELS[category as IndicatorGroup["category"]],
    indicators: items,
  }));
}

export class IndicatorService {
  query(all: Indicator[], options: IndicatorQueryOptions): IndicatorsEngineResult {
    let filtered = all.filter((ind) => {
      if (options.category !== "all" && ind.category !== options.category) return false;
      if (options.status !== "all" && ind.status !== options.status) return false;
      return matchesSearch(ind, options.search);
    });

    filtered = sortIndicators(filtered, options);

    const averageScore =
      filtered.length > 0
        ? Math.round(filtered.reduce((s, i) => s + i.score, 0) / filtered.length)
        : 0;

    const groups = options.groupByCategory ? groupByCategory(filtered) : [];

    return {
      indicators: filtered,
      groups,
      totalCount: filtered.length,
      averageScore,
      evaluatedAt: new Date().toISOString(),
      isSimulated: true,
    };
  }
}

export const indicatorService = new IndicatorService();
