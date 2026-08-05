/** Identificadores de capas GIS — Fase 5.2 */
export const GIS_LAYER_IDS = {
  STATIONS: "stations",
  RIVERS: "rivers",
  WATERSHEDS: "watersheds",
  QUEBRADAS: "quebradas",
  DISTRICTS: "districts",
  PROVINCES: "provinces",
  DEPARTMENTS: "departments",
  NDWI: "ndwi",
  NDVI: "ndvi",
  MNDWI: "mndwi",
  NDTI: "ndti",
  SENTINEL2: "sentinel2-rgb",
  ENVIRONMENTAL_RISK: "environmental-risk",
} as const;

export type GisLayerId = (typeof GIS_LAYER_IDS)[keyof typeof GIS_LAYER_IDS];

/** Configuración global del motor GIS */
export const gisEngineConfig = {
  defaultCrs: "EPSG:4326" as const,
  defaultCenter: {
    latitude: -6.7017,
    longitude: -79.9068,
    zoom: 12,
  },
  supportedFormats: ["geojson", "shapefile", "geotiff", "mock"] as const,
  supportedSatelliteSources: ["landsat8", "landsat9", "sentinel2"] as const,
  schemaVersion: "5.2.0",
} as const;
