"use client";

import { useCallback, useMemo, useState } from "react";
import type { MapCenter, MapFilterField, MapFilterState, RiverContext } from "@/types/geography";
import { ALL_STATIONS_VALUE } from "@/types/geography";
import {
  DEFAULT_MAP_FILTERS,
  buildDashboardTitle,
  findRiverContext,
  getFilteredSummaries,
  getStationDetailById,
  getSummariesForRiver,
  resolveMapView,
} from "@/lib/data/geography-simulated";
import { cascadeFilterChange } from "@/lib/map/filter-utils";
import { computeStatsFromSummaries } from "@/lib/map/stats-utils";
import type { DashboardStats, StationSummary } from "@/types";
import type { StationDetail } from "@/types/station";

export interface UseMapFiltersResult {
  filters: MapFilterState;
  riverContext: RiverContext;
  summaries: StationSummary[];
  filteredStats: DashboardStats;
  mapView: MapCenter;
  dashboardTitle: string;
  recenterToken: number;
  isTransitioning: boolean;
  /** Detalle de estación seleccionada para panel lateral */
  stationDetail: StationDetail | null;
  selectedStationId: string | null;
  setFilter: (field: MapFilterField, value: string) => void;
  selectStation: (stationId: string) => void;
  clearStationSelection: () => void;
  resetFilters: () => void;
  recenterMap: () => void;
}

const LAST_UPDATE = "2025-06-15T10:00:00-05:00";

/**
 * Hook de estado para el panel de control del mapa.
 * Centraliza filtros, vista cartográfica, título dinámico y datos sincronizados.
 */
export function useMapFilters(): UseMapFiltersResult {
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
  const [recenterToken, setRecenterToken] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Estación "elegida" para ver su detalle (click en marcador o chip) — INDEPENDIENTE de
  // filters.stationId. Antes ambas cosas compartían el mismo campo: elegir una estación
  // reescribía el filtro y hacía que getFilteredSummaries() devolviera solo esa estación,
  // borrando el resto de marcadores/chips del mapa. filters.stationId sigue siendo el filtro
  // explícito de /mapa (selector "Estación" en MapControlPanel) — eso no cambia aquí.
  const [pickedStationId, setPickedStationId] = useState<string | null>(null);

  const riverContext = useMemo(() => {
    return findRiverContext(filters) ?? findRiverContext(DEFAULT_MAP_FILTERS)!;
  }, [filters]);

  const summaries = useMemo(
    () => getFilteredSummaries(riverContext.river, filters.stationId),
    [riverContext.river, filters.stationId]
  );

  /** Todas las estaciones del río para KPIs cuando hay filtro de estación individual */
  const allRiverSummaries = useMemo(
    () => getSummariesForRiver(riverContext.river),
    [riverContext.river]
  );

  const statsSource =
    filters.stationId === ALL_STATIONS_VALUE ? summaries : allRiverSummaries;

  const filteredStats = useMemo(
    () => computeStatsFromSummaries(statsSource, LAST_UPDATE),
    [statsSource]
  );

  // Si hay una estación "elegida" (click en marcador/chip), el mapa se recentra en ella; si no,
  // sigue el filtro explícito de /mapa (filters.stationId) como antes.
  const mapView = useMemo(
    () => resolveMapView(riverContext.river, pickedStationId ?? filters.stationId),
    [riverContext.river, pickedStationId, filters.stationId]
  );

  const dashboardTitle = useMemo(
    () => buildDashboardTitle(riverContext.river.name),
    [riverContext.river.name]
  );

  const selectedStationId = pickedStationId;

  const stationDetail = useMemo(() => {
    if (!selectedStationId) return null;
    return getStationDetailById(riverContext.river, riverContext, selectedStationId);
  }, [selectedStationId, riverContext]);

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    setRecenterToken((t) => t + 1);
    window.setTimeout(() => setIsTransitioning(false), 400);
  }, []);

  const setFilter = useCallback(
    (field: MapFilterField, value: string) => {
      setFilters((current) => cascadeFilterChange(current, field, value));
      triggerTransition();
    },
    [triggerTransition]
  );

  const selectStation = useCallback((stationId: string) => {
    // Solo marca cuál está "elegida" (detalle + resaltado + recentrado) — nunca toca
    // filters.stationId, así summaries/markers/chips del mapa siguen mostrando TODAS las
    // estaciones del río, sin importar cuál esté seleccionada.
    setPickedStationId(stationId);
    setRecenterToken((t) => t + 1);
  }, []);

  const clearStationSelection = useCallback(() => {
    setPickedStationId(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_MAP_FILTERS);
    triggerTransition();
  }, [triggerTransition]);

  const recenterMap = useCallback(() => {
    setRecenterToken((t) => t + 1);
  }, []);

  return {
    filters,
    riverContext,
    summaries,
    filteredStats,
    mapView,
    dashboardTitle,
    recenterToken,
    isTransitioning,
    stationDetail,
    selectedStationId,
    setFilter,
    selectStation,
    clearStationSelection,
    resetFilters,
    recenterMap,
  };
}
