/**
 * Tipos del Explorador Satelital — Sprint 3
 */

export type SatellitePlatform = "sentinel2" | "landsat8" | "landsat9";

export type SatelliteImageStatus = "available" | "processing" | "cloudy" | "unavailable";

export type ExplorerBasemapId = "osm" | "carto-light" | "topo";

export interface SatelliteSearchQuery {
  watershedId: string;
  riverId: string;
  stationId: string;
  startDate: string;
  endDate: string;
  satellite: SatellitePlatform;
}

export interface ExplorerMapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface SatelliteSearchResult {
  query: SatelliteSearchQuery;
  images: import("../interfaces/satellite-image.interface").SatelliteImage[];
  total: number;
  searchedAt: string;
  source: "simulated" | "gee";
}

export interface ExplorerFilterOptions {
  watersheds: Array<{ value: string; label: string }>;
  rivers: Array<{ value: string; label: string }>;
  stations: Array<{ value: string; label: string }>;
  satellites: Array<{
    value: SatellitePlatform;
    label: string;
    available: boolean;
  }>;
}
