"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getGeospatialFilterOptions,
  getGeospatialMapData,
  getGeospatialStationDetail,
} from "@/repositories/geospatial.repository";
import type {
  GeoLayerState,
  GeospatialFilters,
  GeoStationDetail,
} from "@/types/geospatial-center";
import { DEFAULT_GEO_LAYERS, DEFAULT_GEOSPATIAL_FILTERS } from "@/types/geospatial-center";

export function useGeospatialCenter() {
  const [filters, setFilters] = useState<GeospatialFilters>(DEFAULT_GEOSPATIAL_FILTERS);
  const [layers, setLayers] = useState<GeoLayerState[]>(DEFAULT_GEO_LAYERS);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const options = useMemo(() => getGeospatialFilterOptions(), []);
  const mapData = useMemo(() => getGeospatialMapData(filters), [filters]);

  const selectedDetail: GeoStationDetail | null = useMemo(() => {
    if (!selectedStationId) return null;
    return getGeospatialStationDetail(selectedStationId);
  }, [selectedStationId]);

  const setFilter = useCallback(
    <K extends keyof GeospatialFilters>(key: K, value: GeospatialFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_GEOSPATIAL_FILTERS);
    setSelectedStationId(null);
  }, []);

  const toggleLayer = useCallback((layerId: GeoLayerState["id"]) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const selectStation = useCallback((domainId: string | null) => {
    setSelectedStationId(domainId);
  }, []);

  const recenter = useCallback(() => {
    setRecenterToken((t) => t + 1);
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    options,
    mapData,
    layers,
    toggleLayer,
    selectedStationId,
    selectedDetail,
    selectStation,
    recenterToken,
    recenter,
  };
}
