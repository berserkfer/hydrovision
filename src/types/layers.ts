/** Tipos del gestor de capas geoespaciales (Fase 4.3) */

export type LayerKind = "vector" | "raster" | "marker";

export type LayerCategory = "administrative" | "hydrographic" | "satellite" | "analysis";

/** Elemento de leyenda automática */
export interface LayerLegendItem {
  label: string;
  color: string;
  description?: string;
}

/** Capa base — contrato común */
export interface BaseLayer {
  id: string;
  name: string;
  description: string;
  kind: LayerKind;
  category: LayerCategory;
  visible: boolean;
  opacity: number;
  legend: LayerLegendItem[];
  zIndex: number;
  isSimulated: true;
  source: "mock" | "google_earth_engine";
}

/** Capa vectorial (polígonos, líneas) */
export interface VectorLayer extends BaseLayer {
  kind: "vector";
  geometryType: "polygon" | "polyline";
  strokeColor: string;
  fillColor: string;
}

/** Capa raster (índices satelitales simulados) */
export interface RasterLayer extends BaseLayer {
  kind: "raster";
  indexKey?: "ndwi" | "ndvi" | "mndwi";
  colorRamp: [string, string];
}

/** Capa de marcadores */
export interface MarkerLayer extends BaseLayer {
  kind: "marker";
}

export type ManagedLayer = VectorLayer | RasterLayer | MarkerLayer;

/** Geometría vectorial simulada */
export interface VectorGeometry {
  layerId: string;
  coordinates: [number, number][] | [number, number][][];
}

/** Bounds para raster simulado */
export interface RasterBounds {
  layerId: string;
  southWest: [number, number];
  northEast: [number, number];
}

/** Estado mutable de capas (UI) */
export interface LayerState {
  layers: ManagedLayer[];
  activeLegendLayerId: string | null;
}

/** Snapshot para componentes de mapa */
export interface LayerManagerSnapshot {
  layers: ManagedLayer[];
  visibleLayers: ManagedLayer[];
  getLayer: (id: string) => ManagedLayer | undefined;
  isVisible: (id: string) => boolean;
  getOpacity: (id: string) => number;
}

export const LAYER_IDS = {
  STATIONS: "stations",
  RIVERS: "rivers",
  WATERSHEDS: "watersheds",
  DISTRICTS: "districts",
  PROVINCES: "provinces",
  DEPARTMENTS: "departments",
  NDWI: "ndwi",
  NDVI: "ndvi",
  MNDWI: "mndwi",
  ENVIRONMENTAL_RISK: "environmental-risk",
} as const;

export type LayerId = (typeof LAYER_IDS)[keyof typeof LAYER_IDS];
