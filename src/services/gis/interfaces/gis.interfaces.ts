/**
 * Interfaces del GIS Engine — Fase 5.2
 */

import type {
  BoundingBox,
  GeoPolygon,
  GeoPolyline,
  GisLegendItem,
  LatLng,
  LayerMetadata,
  MapScale,
  MapViewport,
  SpatialFilter,
  VectorStyle,
} from "../types";

/** Capa base del mapa */
export interface MapLayer {
  id: string;
  name: string;
  description: string;
  type: "vector" | "raster" | "marker";
  visible: boolean;
  opacity: number;
  zIndex: number;
  bbox?: BoundingBox;
  legend: GisLegendItem[];
  metadata: LayerMetadata;
}

/** Capa vectorial */
export interface VectorLayer extends MapLayer {
  type: "vector";
  geometryType: "polygon" | "polyline" | "point";
  geometries: GeoPolygon[] | GeoPolyline[];
  style: VectorStyle;
}

/** Capa raster */
export interface RasterLayer extends MapLayer {
  type: "raster";
  bounds: BoundingBox;
  format: "geotiff" | "png" | "simulated";
  colorRamp?: [string, string];
  indexKey?: "ndwi" | "ndvi" | "mndwi" | "ndti";
}

/** Punto de monitoreo georreferenciado */
export interface MonitoringStation {
  id: string;
  code: string;
  name: string;
  position: LatLng;
  altitude: number;
  riverId: string;
  watershedId: string;
  segment: string;
  status: "active" | "maintenance" | "offline";
}

/** Río georreferenciado */
export interface River {
  id: string;
  name: string;
  center: LatLng;
  path: GeoPolyline;
  lengthKm: number;
  watershedId: string;
}

/** Cuenca hidrográfica */
export interface Watershed {
  id: string;
  name: string;
  areaKm2: number;
  boundary: GeoPolygon;
  center: LatLng;
  rivers: River[];
}

/** Imagen satelital simulada */
export interface SatelliteImage {
  id: string;
  stationId: string;
  acquiredAt: string;
  source: "landsat8" | "landsat9" | "sentinel2";
  bounds: BoundingBox;
  indices: {
    ndwi: number;
    ndvi: number;
    mndwi: number;
    ndti: number;
  };
  cloudCover: number;
  simulatedUrl?: string;
}

/** Repositorio de datos geoespaciales */
export interface GISRepository {
  getWatersheds(): Watershed[];
  getRivers(filter?: SpatialFilter): River[];
  getMonitoringStations(filter?: SpatialFilter): MonitoringStation[];
  getSatelliteImages(filter?: SpatialFilter): SatelliteImage[];
  getMapLayers(): MapLayer[];
  getVectorLayers(filter?: SpatialFilter): VectorLayer[];
  getRasterLayers(viewport: MapViewport): RasterLayer[];
  getVectorGeometries(layerIds: string[], context: { riverId: string; viewport: MapViewport }): Array<{
    layerId: string;
    coordinates: GeoPolyline | GeoPolygon;
  }>;
}

/** Servicio de lógica GIS */
export interface GISService {
  getLayers(): MapLayer[];
  getVisibleLayers(): MapLayer[];
  toggleLayer(layerId: string): MapLayer[];
  setLayerVisibility(layerId: string, visible: boolean): MapLayer[];
  setLayerOpacity(layerId: string, opacity: number): MapLayer[];
  resetLayers(): MapLayer[];
  applySpatialFilter(filter: SpatialFilter): {
    stations: MonitoringStation[];
    rivers: River[];
    watersheds: Watershed[];
  };
  computeAutoZoom(bbox: BoundingBox): number;
  computeBoundingBox(points: LatLng[]): BoundingBox;
  getLegend(layerId: string): GisLegendItem[];
  getScale(zoom: number, latitude?: number): MapScale;
  selectLayers(layerIds: string[]): MapLayer[];
  addExternalLayer(layer: MapLayer): void;
}

/** Proveedor de mapa (agnóstico de Leaflet) */
export interface MapProvider {
  getDefaultViewport(): MapViewport;
  getCoordinateSystem(): "EPSG:4326";
  getTileConfig(): { url: string; attribution: string };
  toMapCoordinates(latlng: LatLng): [number, number];
  fromMapCoordinates(coords: [number, number]): LatLng;
}
