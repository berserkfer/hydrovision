"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createStation,
  deleteStation,
  fetchStationsList,
  updateStation,
} from "@/lib/api/stations.client";
import { withApiToast } from "@/lib/api/notify";
import type {
  MonitoringStationRecord,
  StationFilters,
  StationStats,
} from "@/types/station-management";
import type { CreateStationInput } from "@/server/validators/schemas/crud.schemas";

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
  const [stations, setStations] = useState(initialStations);
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const filtered = useMemo(
    () => applyStationFilters(stations, filters),
    [stations, filters]
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

  const refreshFromApi = useCallback(async () => {
    const data = await fetchStationsList();
    setStations(data.stations);
    setStats(data.stats);
  }, []);

  const handleCreate = useCallback(
    async (input: CreateStationInput) => {
      const result = await withApiToast(() => createStation(input), {
        success: "Estación registrada correctamente",
        error: "No se pudo crear la estación",
      });
      if (result) await refreshFromApi();
    },
    [refreshFromApi]
  );

  const handleUpdate = useCallback(
    async (id: string, input: Partial<CreateStationInput>) => {
      const result = await withApiToast(() => updateStation(id, input), {
        success: "Estación actualizada correctamente",
        error: "No se pudo actualizar la estación",
      });
      if (result) await refreshFromApi();
    },
    [refreshFromApi]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await withApiToast(() => deleteStation(id), {
        success: "Estación eliminada correctamente",
        error: "No se pudo eliminar la estación",
      });
      if (result) await refreshFromApi();
    },
    [refreshFromApi]
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
    stats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    createStation: handleCreate,
    updateStation: handleUpdate,
    deleteStation: handleDelete,
    refreshStations: refreshFromApi,
    viewMode,
    setViewMode,
  };
}
