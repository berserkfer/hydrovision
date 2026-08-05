"use client";

import { useCallback, useMemo, useState } from "react";
import type { TemporalAnalysisFilters, TemporalAnalysisResult } from "@/types/temporal";
import {
  DEFAULT_TEMPORAL_END,
  DEFAULT_TEMPORAL_START,
  temporalEngine,
} from "@/services/temporal";
import { getTemporalStationName } from "@/repositories/temporal.repository";
import type { TemporalStationOption } from "@/repositories/temporal.repository";

interface UseTemporalAnalysisOptions {
  stations: TemporalStationOption[];
  initialStationId?: string;
}

export function useTemporalAnalysis({ stations, initialStationId }: UseTemporalAnalysisOptions) {
  const defaultStationId = initialStationId ?? stations[0]?.id ?? "";

  const [filters, setFilters] = useState<TemporalAnalysisFilters>({
    stationId: defaultStationId,
    parameter: "turbidez",
    startDate: DEFAULT_TEMPORAL_START,
    endDate: DEFAULT_TEMPORAL_END,
  });

  const [exportToast, setExportToast] = useState(false);

  const result: TemporalAnalysisResult | null = useMemo(() => {
    if (!filters.stationId) return null;
    const stationName = getTemporalStationName(filters.stationId);
    return temporalEngine.analyze(filters, stationName);
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof TemporalAnalysisFilters>(key: K, value: TemporalAnalysisFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      stationId: defaultStationId,
      parameter: "turbidez",
      startDate: DEFAULT_TEMPORAL_START,
      endDate: DEFAULT_TEMPORAL_END,
    });
  }, [defaultStationId]);

  const exportChart = useCallback(() => {
    setExportToast(true);
  }, []);

  const dismissExportToast = useCallback(() => {
    setExportToast(false);
  }, []);

  const selectedStation = stations.find((s) => s.id === filters.stationId);

  return {
    filters,
    setFilter,
    resetFilters,
    result,
    selectedStation,
    exportChart,
    exportToast,
    dismissExportToast,
  };
}
