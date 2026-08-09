"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_EXPLORER_QUERY,
  getExplorerFilterOptions,
  getSatelliteSearchService,
  resolveExplorerViewport,
  type ExplorerBasemapId,
  type ExplorerMapViewport,
  type SatelliteImage,
  type SatelliteMetadata,
  type SatelliteSearchQuery,
  type SatelliteSearchResult,
} from "@/services/satellite-explorer";

export interface UseSatelliteExplorerResult {
  query: SatelliteSearchQuery;
  viewport: ExplorerMapViewport;
  basemapId: ExplorerBasemapId;
  metadata: SatelliteMetadata | undefined;
  filterOptions: ReturnType<ReturnType<typeof getSatelliteSearchService>["getFilterOptions"]>;
  results: SatelliteImage[];
  lastResult: SatelliteSearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  recenterToken: number;
  setQueryField: <K extends keyof SatelliteSearchQuery>(field: K, value: SatelliteSearchQuery[K]) => void;
  setBasemapId: (basemapId: ExplorerBasemapId) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  recenterMap: () => void;
  searchImages: () => Promise<void>;
}

export function useSatelliteExplorer(): UseSatelliteExplorerResult {
  const searchService = useMemo(() => getSatelliteSearchService(), []);

  const [query, setQuery] = useState<SatelliteSearchQuery>(DEFAULT_EXPLORER_QUERY);
  const [viewport, setViewport] = useState<ExplorerMapViewport>(() =>
    resolveExplorerViewport(
      DEFAULT_EXPLORER_QUERY.watershedId,
      DEFAULT_EXPLORER_QUERY.riverId,
      DEFAULT_EXPLORER_QUERY.stationId
    )
  );
  const [basemapId, setBasemapId] = useState<ExplorerBasemapId>("osm");
  const [results, setResults] = useState<SatelliteImage[]>([]);
  const [lastResult, setLastResult] = useState<SatelliteSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const filterOptions = useMemo(
    () => searchService.getFilterOptions(query),
    [searchService, query.watershedId, query.riverId]
  );

  const metadata = useMemo(
    () => searchService.getMetadata(query.satellite),
    [searchService, query.satellite]
  );

  const setQueryField = useCallback(
    <K extends keyof SatelliteSearchQuery>(field: K, value: SatelliteSearchQuery[K]) => {
      setQuery((current) => {
        const next = { ...current, [field]: value };

        if (field === "watershedId") {
          const geo = getExplorerFilterOptions(String(value), next.riverId);
          next.riverId = geo.rivers[0]?.value ?? next.riverId;
          next.stationId = "all";
        }

        if (field === "riverId") {
          next.stationId = "all";
        }

        setViewport(resolveExplorerViewport(next.watershedId, next.riverId, next.stationId));
        setRecenterToken((token) => token + 1);

        return next;
      });
    },
    [searchService]
  );

  const zoomIn = useCallback(() => {
    setViewport((current) => ({ ...current, zoom: Math.min(current.zoom + 1, 16) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((current) => ({ ...current, zoom: Math.max(current.zoom - 1, 8) }));
  }, []);

  const recenterMap = useCallback(() => {
    setViewport(resolveExplorerViewport(query.watershedId, query.riverId, query.stationId));
    setRecenterToken((token) => token + 1);
  }, [query.riverId, query.stationId, query.watershedId]);

  const searchImages = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await searchService.search(query);
      setResults(result.images);
      setLastResult(result);
    } catch (error) {
      setResults([]);
      setLastResult(null);
      setSearchError(error instanceof Error ? error.message : "Error al buscar imágenes.");
    } finally {
      setIsSearching(false);
    }
  }, [query, searchService]);

  return {
    query,
    viewport,
    basemapId,
    metadata,
    filterOptions,
    results,
    lastResult,
    isSearching,
    searchError,
    recenterToken,
    setQueryField,
    setBasemapId,
    zoomIn,
    zoomOut,
    recenterMap,
    searchImages,
  };
}
