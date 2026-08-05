"use client";

import { useCallback, useMemo, useState } from "react";
import type { DashboardStats, StationSummary } from "@/types";
import type { IndicatorQueryOptions, IndicatorsEngineResult } from "@/types/indicators";
import { DEFAULT_INDICATOR_QUERY } from "@/types/indicators";
import { indicatorsEngine } from "@/services/indicators";

interface UseIndicatorsCenterInput {
  stats: DashboardStats;
  summaries: StationSummary[];
  riverId: string;
}

export function useIndicatorsCenter({ stats, summaries, riverId }: UseIndicatorsCenterInput) {
  const [query, setQuery] = useState<IndicatorQueryOptions>(DEFAULT_INDICATOR_QUERY);

  const result: IndicatorsEngineResult = useMemo(
    () => indicatorsEngine.evaluate({ stats, summaries, riverId, query }),
    [stats, summaries, riverId, query]
  );

  const categories = useMemo(() => indicatorsEngine.getCategories(), []);

  const setSearch = useCallback((search: string) => {
    setQuery((q) => ({ ...q, search }));
  }, []);

  const setCategory = useCallback((category: IndicatorQueryOptions["category"]) => {
    setQuery((q) => ({ ...q, category }));
  }, []);

  const setStatus = useCallback((status: IndicatorQueryOptions["status"]) => {
    setQuery((q) => ({ ...q, status }));
  }, []);

  const setSortBy = useCallback((sortBy: IndicatorQueryOptions["sortBy"]) => {
    setQuery((q) => ({ ...q, sortBy }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setQuery((q) => ({ ...q, sortOrder: q.sortOrder === "asc" ? "desc" : "asc" }));
  }, []);

  const toggleGroupByCategory = useCallback(() => {
    setQuery((q) => ({ ...q, groupByCategory: !q.groupByCategory }));
  }, []);

  const resetQuery = useCallback(() => {
    setQuery(DEFAULT_INDICATOR_QUERY);
  }, []);

  return {
    result,
    query,
    categories,
    setSearch,
    setCategory,
    setStatus,
    setSortBy,
    toggleSortOrder,
    toggleGroupByCategory,
    resetQuery,
  };
}
