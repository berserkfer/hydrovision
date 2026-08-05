"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  ParameterFilters,
  ParameterSummaryStats,
  WaterParameterRecord,
} from "@/types/parameter-management";
import { DEFAULT_PARAMETER_FILTERS } from "@/types/parameter-management";

function applyParameterFilters(
  records: WaterParameterRecord[],
  filters: ParameterFilters
): WaterParameterRecord[] {
  return records.filter((record) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        record.parameterName.toLowerCase().includes(q) ||
        record.estacionCodigo.toLowerCase().includes(q) ||
        record.estacionNombre.toLowerCase().includes(q) ||
        record.campanaCodigo.toLowerCase().includes(q) ||
        record.campanaNombre.toLowerCase().includes(q) ||
        record.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.estacionId && record.estacionId !== filters.estacionId) return false;
    if (filters.campanaId && record.campanaId !== filters.campanaId) return false;
    if (filters.category && record.category !== filters.category) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (filters.fecha && record.fecha !== filters.fecha) return false;
    return true;
  });
}

interface UseParametersOptions {
  initialRecords: WaterParameterRecord[];
  initialStats: ParameterSummaryStats;
}

export function useParameters({ initialRecords, initialStats }: UseParametersOptions) {
  const [filters, setFilters] = useState<ParameterFilters>(DEFAULT_PARAMETER_FILTERS);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const filtered = useMemo(
    () => applyParameterFilters(initialRecords, filters),
    [initialRecords, filters]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.estacionId ||
          filters.campanaId ||
          filters.category ||
          filters.status ||
          filters.fecha
      ),
    [filters]
  );

  const setFilter = useCallback(<K extends keyof ParameterFilters>(key: K, value: ParameterFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_PARAMETER_FILTERS);
  }, []);

  return {
    records: filtered,
    allFiltered: filtered,
    stats: initialStats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    viewMode,
    setViewMode,
  };
}
