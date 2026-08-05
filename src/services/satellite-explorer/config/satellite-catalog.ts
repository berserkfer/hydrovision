/**
 * Catálogo de plataformas satelitales — Sprint 3
 */

import type { ExplorerBasemapId } from "../types/satellite-explorer.types";
import type { SatelliteCollection } from "../interfaces/satellite-collection.interface";

export const SATELLITE_COLLECTIONS: SatelliteCollection[] = [
  {
    id: "sentinel-2-l2a",
    platform: "sentinel2",
    name: "Sentinel-2 MSI",
    description: "Imágenes multiespectrales de alta resolución (ESA Copernicus).",
    isActive: true,
    metadata: {
      platform: "sentinel2",
      displayName: "Sentinel-2",
      spatialResolutionMeters: 10,
      temporalResolutionDays: 5,
      bands: ["B2", "B3", "B4", "B8", "B11", "B12"],
      calculableIndices: ["NDVI", "NDWI", "MNDWI", "NDTI", "EVI"],
      provider: "ESA / Copernicus",
      collectionId: "COPERNICUS/S2_SR_HARMONIZED",
    },
  },
  {
    id: "landsat-8-l2",
    platform: "landsat8",
    name: "Landsat 8 OLI/TIRS",
    description: "Colección de superficie Landsat 8 — disponible próximamente.",
    isActive: false,
    comingSoon: true,
    metadata: {
      platform: "landsat8",
      displayName: "Landsat 8",
      spatialResolutionMeters: 30,
      temporalResolutionDays: 16,
      bands: ["B2", "B3", "B4", "B5", "B6", "B7"],
      calculableIndices: ["NDVI", "NDWI", "MNDWI", "NDTI"],
      provider: "USGS / NASA",
      collectionId: "LANDSAT/LC08/C02/T1_L2",
    },
  },
  {
    id: "landsat-9-l2",
    platform: "landsat9",
    name: "Landsat 9 OLI/TIRS",
    description: "Colección de superficie Landsat 9 — disponible próximamente.",
    isActive: false,
    comingSoon: true,
    metadata: {
      platform: "landsat9",
      displayName: "Landsat 9",
      spatialResolutionMeters: 30,
      temporalResolutionDays: 16,
      bands: ["B2", "B3", "B4", "B5", "B6", "B7"],
      calculableIndices: ["NDVI", "NDWI", "MNDWI", "NDTI"],
      provider: "USGS / NASA",
      collectionId: "LANDSAT/LC09/C02/T1_L2",
    },
  },
];

export const EXPLORER_BASEMAPS: Array<{
  id: ExplorerBasemapId;
  label: string;
  url: string;
  attribution: string;
}> = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: "carto-light",
    label: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  {
    id: "topo",
    label: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenTopoMap',
  },
];

export const DEFAULT_EXPLORER_QUERY = {
  watershedId: "cuenca-reque",
  riverId: "rio-reque",
  stationId: "all",
  startDate: "2025-06-01",
  endDate: "2025-08-01",
  satellite: "sentinel2" as const,
};

export const EXPLORER_ZOOM = {
  min: 8,
  max: 16,
  default: 12,
  step: 1,
};
