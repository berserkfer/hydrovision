/**
 * Tipos geoespaciales base — GIS Engine (Fase 5.2)
 */

/** Sistemas de coordenadas soportados */
export type CoordinateSystem = "EPSG:4326" | "EPSG:3857";

/** Punto geográfico WGS84 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Centro de mapa con zoom */
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  crs?: CoordinateSystem;
}

/** Bounding box geográfico */
export interface BoundingBox {
  southWest: LatLng;
  northEast: LatLng;
}

/** Polígono GeoJSON-like (anillo exterior) */
export type GeoPolygon = LatLng[];

/** Polilínea */
export type GeoPolyline = LatLng[];

/** Formatos geoespaciales preparados (Fase 6+) */
export type GeoDataFormat = "geojson" | "shapefile" | "geotiff" | "mock";

/** Fuentes satelitales preparadas */
export type SatelliteSource = "landsat8" | "landsat9" | "sentinel2" | "mock";

/** Elemento de leyenda GIS */
export interface GisLegendItem {
  label: string;
  color: string;
  description?: string;
}

/** Escala cartográfica derivada del zoom */
export interface MapScale {
  ratio: string;
  metersPerPixel: number;
  zoom: number;
}

/** Filtro espacial */
export interface SpatialFilter {
  departmentId?: string;
  provinceId?: string;
  districtId?: string;
  watershedId?: string;
  riverId?: string;
  stationId?: string;
  bbox?: BoundingBox;
}

/** Estilo vectorial */
export interface VectorStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

/** Metadatos de capa */
export interface LayerMetadata {
  isSimulated: boolean;
  source: "mock" | "google_earth_engine" | "file";
  format?: GeoDataFormat;
  crs: CoordinateSystem;
  category: "administrative" | "hydrographic" | "satellite" | "analysis";
}
