/**
 * Adaptador GIS MapLayer → ManagedLayer (compatibilidad UI Fase 4.3)
 */

import type {
  LayerCategory,
  ManagedLayer,
  RasterLayer as UiRasterLayer,
  VectorLayer as UiVectorLayer,
} from "@/types/layers";
import type { MapLayer, RasterLayer, VectorLayer } from "../interfaces";
import { GIS_LAYER_IDS } from "../config";

const VECTOR_STYLES: Record<string, Pick<UiVectorLayer, "geometryType" | "strokeColor" | "fillColor">> = {
  [GIS_LAYER_IDS.RIVERS]: { geometryType: "polyline", strokeColor: "#0891b2", fillColor: "transparent" },
  [GIS_LAYER_IDS.WATERSHEDS]: { geometryType: "polygon", strokeColor: "#0284c7", fillColor: "#0ea5e9" },
  [GIS_LAYER_IDS.QUEBRADAS]: { geometryType: "polyline", strokeColor: "#06b6d4", fillColor: "transparent" },
  [GIS_LAYER_IDS.DISTRICTS]: { geometryType: "polygon", strokeColor: "#6366f1", fillColor: "#818cf8" },
  [GIS_LAYER_IDS.PROVINCES]: { geometryType: "polygon", strokeColor: "#7c3aed", fillColor: "#a78bfa" },
  [GIS_LAYER_IDS.DEPARTMENTS]: { geometryType: "polygon", strokeColor: "#9333ea", fillColor: "#c084fc" },
};

const RASTER_RAMPS: Record<string, [string, string]> = {
  [GIS_LAYER_IDS.NDWI]: ["#1e3a5f", "#38bdf8"],
  [GIS_LAYER_IDS.NDVI]: ["#fef3c7", "#16a34a"],
  [GIS_LAYER_IDS.MNDWI]: ["#ecfdf5", "#059669"],
  [GIS_LAYER_IDS.NDTI]: ["#dbeafe", "#92400e"],
  [GIS_LAYER_IDS.SENTINEL2]: ["#1e293b", "#38bdf8"],
  [GIS_LAYER_IDS.ENVIRONMENTAL_RISK]: ["#10b981", "#ef4444"],
};

const RASTER_INDEX: Partial<Record<string, UiRasterLayer["indexKey"]>> = {
  [GIS_LAYER_IDS.NDWI]: "ndwi",
  [GIS_LAYER_IDS.NDVI]: "ndvi",
  [GIS_LAYER_IDS.MNDWI]: "mndwi",
};

/** Convierte capa GIS a ManagedLayer para componentes React existentes */
export function toManagedLayer(layer: MapLayer): ManagedLayer {
  const base = {
    id: layer.id,
    name: layer.name,
    description: layer.description,
    category: layer.metadata.category as LayerCategory,
    visible: layer.visible,
    opacity: layer.opacity,
    zIndex: layer.zIndex,
    legend: layer.legend,
    isSimulated: true as const,
    source: layer.metadata.source === "google_earth_engine" ? "google_earth_engine" as const : "mock" as const,
  };

  if (layer.type === "marker") {
    return { ...base, kind: "marker" };
  }

  if (layer.type === "vector") {
    const style = VECTOR_STYLES[layer.id] ?? {
      geometryType: "polygon" as const,
      strokeColor: "#64748b",
      fillColor: "#94a3b8",
    };
    return { ...base, kind: "vector", ...style };
  }

  return {
    ...base,
    kind: "raster",
    colorRamp: RASTER_RAMPS[layer.id] ?? ["#000000", "#ffffff"],
    indexKey: RASTER_INDEX[layer.id],
  };
}

export function toManagedLayers(layers: MapLayer[]): ManagedLayer[] {
  return layers
    .filter((l) => l.id !== GIS_LAYER_IDS.QUEBRADAS && l.id !== GIS_LAYER_IDS.NDTI && l.id !== GIS_LAYER_IDS.SENTINEL2)
    .map(toManagedLayer);
}

/** Convierte ManagedLayer → MapLayer parcial para sincronizar estado UI → GIS */
export function syncMapLayerFromManaged(managed: ManagedLayer, gis: MapLayer): MapLayer {
  return {
    ...gis,
    visible: managed.visible,
    opacity: managed.opacity,
  };
}

/** Convierte geometrías GIS a formato Leaflet legacy */
export function toLegacyVectorGeometry(
  layerId: string,
  coordinates: import("../types").GeoPolyline | import("../types").GeoPolygon
): { layerId: string; coordinates: [number, number][] | [number, number][][] } {
  if (coordinates.length === 0) {
    return { layerId, coordinates: [] };
  }

  const first = coordinates[0];
  if (typeof first === "object" && "latitude" in first) {
    const ring = (coordinates as import("../types").GeoPolygon).map(
      (p) => [p.latitude, p.longitude] as [number, number]
    );
    return { layerId, coordinates: ring };
  }

  return { layerId, coordinates: [] };
}

export function gisGeometriesToLegacy(
  geometries: Array<{ layerId: string; coordinates: import("../types").GeoPolyline | import("../types").GeoPolygon }>
): Array<{ layerId: string; coordinates: [number, number][] }> {
  return geometries.map(({ layerId, coordinates }) => {
    const ring = (coordinates as import("../types").GeoPolygon).map(
      (p) => [p.latitude, p.longitude] as [number, number]
    );
    return { layerId, coordinates: ring };
  });
}

export function gisRasterToLegacyBounds(
  rasters: RasterLayer[]
): Array<{ layerId: string; southWest: [number, number]; northEast: [number, number] }> {
  return rasters.map((r) => ({
    layerId: r.id,
    southWest: [r.bounds.southWest.latitude, r.bounds.southWest.longitude],
    northEast: [r.bounds.northEast.latitude, r.bounds.northEast.longitude],
  }));
}
