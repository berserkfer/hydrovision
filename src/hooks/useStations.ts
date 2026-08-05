"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  MonitoringStationRecord,
  StationFilters,
  StationStats,
} from "@/types/station-management";

const DEFAULT_FILTERS: StationFilters = {
  search: "",
  cuencaId: "",
  rioId: "",
  estado: "",
  clasificacionEca: "",
};

function applyStationFilters(
  stations: MonitoringStationRecord[],
  filters: StationFilters
): MonitoringStationRecord[] {
  return stations.filter((station) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        station.codigo.toLowerCase().includes(q) ||
        station.nombre.toLowerCase().includes(q) ||
        station.rioNombre.toLowerCase().includes(q) ||
        station.cuencaNombre.toLowerCase().includes(q) ||
        station.departamentoNombre.toLowerCase().includes(q) ||
        station.tramo.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.cuencaId && station.cuencaId !== filters.cuencaId) return false;
    if (filters.rioId && station.rioId !== filters.rioId) return false;
    if (filters.estado && station.estado !== filters.estado) return false;
    if (filters.clasificacionEca && station.clasificacionEca !== filters.clasificacionEca) return false;
    return true;
  });
}

interface UseStationsOptions {
  initialStations: MonitoringStationRecord[];
  initialStats: StationStats;
}

export function useStations({ initialStations, initialStats }: UseStationsOptions) {
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const filtered = useMemo(
    () => applyStationFilters(initialStations, filters),
    [initialStations, filters]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.cuencaId ||
          filters.rioId ||
          filters.estado ||
          filters.clasificacionEca
      ),
    [filters]
  );

  const setFilter = useCallback(<K extends keyof StationFilters>(key: K, value: StationFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    stations: filtered,
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
