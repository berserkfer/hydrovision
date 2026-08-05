/**
 * MockGISRepository — datos geoespaciales simulados (Fase 5.2)
 */

import { getDataStore } from "@/data/store-access";
import type {
  GISRepository,
  MapLayer,
  MonitoringStation,
  RasterLayer,
  River,
  SatelliteImage,
  VectorLayer,
  Watershed,
} from "../interfaces";
import { GIS_LAYER_CATALOG, GIS_LAYER_IDS } from "../config";
import type { GeoPolygon, GeoPolyline, LatLng, MapViewport, SpatialFilter } from "../types";
import { computeBoundingBox, isPointInBBox } from "../utils";

function rectPolygon(center: LatLng, scale: number): GeoPolygon {
  const dLat = 0.04 * scale;
  const dLng = 0.05 * scale;
  return [
    { latitude: center.latitude - dLat, longitude: center.longitude - dLng },
    { latitude: center.latitude - dLat, longitude: center.longitude + dLng },
    { latitude: center.latitude + dLat, longitude: center.longitude + dLng },
    { latitude: center.latitude + dLat, longitude: center.longitude - dLng },
  ];
}

function mapOperationalStatus(
  status: string
): MonitoringStation["status"] {
  if (status === "maintenance") return "maintenance";
  if (status === "offline") return "offline";
  return "active";
}

export class MockGISRepository implements GISRepository {
  getMapLayers(): MapLayer[] {
    return GIS_LAYER_CATALOG.map((layer) => ({ ...layer }));
  }

  getWatersheds(): Watershed[] {
    const store = getDataStore();
    return store.cuencas.map((cuenca) => {
      const rios = store.rios.filter((r) => r.cuencaId === cuenca.id);
      const center = rios[0]?.centro ?? { latitude: -6.7017, longitude: -79.9068, zoom: 12 };
      return {
        id: cuenca.id,
        name: cuenca.nombre,
        areaKm2: cuenca.areaKm2,
        center: { latitude: center.latitude, longitude: center.longitude },
        boundary: rectPolygon({ latitude: center.latitude, longitude: center.longitude }, 1.2),
        rivers: this.getRivers({ watershedId: cuenca.id }),
      };
    });
  }

  getRivers(filter?: SpatialFilter): River[] {
    const store = getDataStore();
    let rios = store.rios;

    if (filter?.watershedId) {
      rios = rios.filter((r) => r.cuencaId === filter.watershedId);
    }
    if (filter?.riverId) {
      rios = rios.filter((r) => r.id === filter.riverId);
    }

    return rios.map((rio) => {
      const estaciones = store.estaciones.filter((e) => e.rioId === rio.id);
      const path: GeoPolyline = estaciones.length >= 2
        ? estaciones.map((e) => ({
            latitude: e.coordenadas.latitude,
            longitude: e.coordenadas.longitude,
          }))
        : [
            { latitude: rio.centro.latitude - 0.02, longitude: rio.centro.longitude - 0.03 },
            { latitude: rio.centro.latitude, longitude: rio.centro.longitude },
            { latitude: rio.centro.latitude + 0.02, longitude: rio.centro.longitude + 0.03 },
          ];

      return {
        id: rio.id,
        name: rio.nombre,
        center: { latitude: rio.centro.latitude, longitude: rio.centro.longitude },
        path,
        lengthKm: rio.longitudKm,
        watershedId: rio.cuencaId,
      };
    });
  }

  getMonitoringStations(filter?: SpatialFilter): MonitoringStation[] {
    const store = getDataStore();
    let estaciones = store.estaciones;

    if (filter?.riverId) {
      estaciones = estaciones.filter((e) => e.rioId === filter.riverId);
    }
    if (filter?.stationId) {
      estaciones = estaciones.filter((e) => e.id === filter.stationId);
    }
    if (filter?.bbox) {
      estaciones = estaciones.filter((e) =>
        isPointInBBox(
          { latitude: e.coordenadas.latitude, longitude: e.coordenadas.longitude },
          filter.bbox!
        )
      );
    }

    return estaciones.map((e) => ({
      id: e.id,
      code: e.codigo,
      name: e.nombre,
      position: { latitude: e.coordenadas.latitude, longitude: e.coordenadas.longitude },
      altitude: e.altitud,
      riverId: e.rioId,
      watershedId: e.cuencaId,
      segment: e.tramo,
      status: mapOperationalStatus(e.estadoOperativo),
    }));
  }

  getSatelliteImages(filter?: SpatialFilter): SatelliteImage[] {
    const store = getDataStore();
    let indices = store.indicesSatelitales;

    if (filter?.stationId) {
      indices = indices.filter((i) => i.estacionId === filter.stationId);
    }

    return indices.map((idx) => {
      const estacion = store.estaciones.find((e) => e.id === idx.estacionId);
      const center = estacion
        ? { latitude: estacion.coordenadas.latitude, longitude: estacion.coordenadas.longitude }
        : { latitude: -6.7017, longitude: -79.9068 };

      const bounds = computeBoundingBox([
        center,
        { latitude: center.latitude + 0.02, longitude: center.longitude + 0.02 },
      ]);

      return {
        id: idx.id,
        stationId: idx.estacionId,
        acquiredAt: idx.fechaAdquisicion,
        source: idx.fuente as SatelliteImage["source"],
        bounds,
        indices: {
          ndwi: idx.ndwi,
          ndvi: idx.ndvi,
          mndwi: idx.mndwi,
          ndti: idx.ndti,
        },
        cloudCover: idx.coberturaNubosa,
        simulatedUrl: `mock://satellite/${idx.id}`,
      };
    });
  }

  getVectorLayers(filter?: SpatialFilter): VectorLayer[] {
    const viewport: MapViewport = {
      latitude: -6.7017,
      longitude: -79.9068,
      zoom: 12,
    };

    if (filter?.riverId) {
      const river = getDataStore().rios.find((r) => r.id === filter.riverId);
      if (river) {
        viewport.latitude = river.centro.latitude;
        viewport.longitude = river.centro.longitude;
        viewport.zoom = river.centro.zoom;
      }
    }

    const geometries = this.getVectorGeometries(
      [
        GIS_LAYER_IDS.RIVERS,
        GIS_LAYER_IDS.WATERSHEDS,
        GIS_LAYER_IDS.QUEBRADAS,
        GIS_LAYER_IDS.DISTRICTS,
        GIS_LAYER_IDS.PROVINCES,
        GIS_LAYER_IDS.DEPARTMENTS,
      ],
      { riverId: filter?.riverId ?? "rio-reque", viewport }
    );

    const styles: Record<string, { strokeColor: string; fillColor: string; geometryType: VectorLayer["geometryType"] }> = {
      [GIS_LAYER_IDS.RIVERS]: { strokeColor: "#0891b2", fillColor: "transparent", geometryType: "polyline" },
      [GIS_LAYER_IDS.WATERSHEDS]: { strokeColor: "#0284c7", fillColor: "#0ea5e9", geometryType: "polygon" },
      [GIS_LAYER_IDS.QUEBRADAS]: { strokeColor: "#06b6d4", fillColor: "transparent", geometryType: "polyline" },
      [GIS_LAYER_IDS.DISTRICTS]: { strokeColor: "#6366f1", fillColor: "#818cf8", geometryType: "polygon" },
      [GIS_LAYER_IDS.PROVINCES]: { strokeColor: "#7c3aed", fillColor: "#a78bfa", geometryType: "polygon" },
      [GIS_LAYER_IDS.DEPARTMENTS]: { strokeColor: "#9333ea", fillColor: "#c084fc", geometryType: "polygon" },
    };

    return GIS_LAYER_CATALOG.filter((l) => l.type === "vector").map((base) => {
      const geom = geometries.find((g) => g.layerId === base.id);
      const style = styles[base.id] ?? { strokeColor: "#64748b", fillColor: "#94a3b8", geometryType: "polygon" as const };
      const coords = geom?.coordinates ?? [];
      return {
        ...base,
        type: "vector" as const,
        geometryType: style.geometryType,
        geometries: Array.isArray(coords[0]) && typeof (coords[0] as LatLng).latitude === "number"
          ? [coords as GeoPolygon]
          : style.geometryType === "polyline"
            ? [coords as GeoPolyline]
            : [coords as GeoPolygon],
        style: {
          strokeColor: style.strokeColor,
          fillColor: style.fillColor,
          strokeWidth: 2,
          fillOpacity: base.opacity,
        },
      };
    });
  }

  getRasterLayers(viewport: MapViewport): RasterLayer[] {
    const sw: LatLng = { latitude: viewport.latitude - 0.06, longitude: viewport.longitude - 0.07 };
    const ne: LatLng = { latitude: viewport.latitude + 0.06, longitude: viewport.longitude + 0.07 };
    const bounds = { southWest: sw, northEast: ne };

    const ramps: Record<string, [string, string]> = {
      [GIS_LAYER_IDS.NDWI]: ["#1e3a5f", "#38bdf8"],
      [GIS_LAYER_IDS.NDVI]: ["#fef3c7", "#16a34a"],
      [GIS_LAYER_IDS.MNDWI]: ["#ecfdf5", "#059669"],
      [GIS_LAYER_IDS.NDTI]: ["#dbeafe", "#92400e"],
      [GIS_LAYER_IDS.SENTINEL2]: ["#1e293b", "#38bdf8"],
      [GIS_LAYER_IDS.ENVIRONMENTAL_RISK]: ["#10b981", "#ef4444"],
    };

    const indexKeys: Partial<Record<string, RasterLayer["indexKey"]>> = {
      [GIS_LAYER_IDS.NDWI]: "ndwi",
      [GIS_LAYER_IDS.NDVI]: "ndvi",
      [GIS_LAYER_IDS.MNDWI]: "mndwi",
      [GIS_LAYER_IDS.NDTI]: "ndti",
    };

    return GIS_LAYER_CATALOG.filter((l) => l.type === "raster").map((base) => ({
      ...base,
      type: "raster" as const,
      bounds,
      format: base.id === GIS_LAYER_IDS.SENTINEL2 ? "geotiff" as const : "simulated" as const,
      colorRamp: ramps[base.id],
      indexKey: indexKeys[base.id],
    }));
  }

  getVectorGeometries(
    layerIds: string[],
    context: { riverId: string; viewport: MapViewport }
  ): Array<{ layerId: string; coordinates: GeoPolyline | GeoPolygon }> {
    const river = this.getRivers({ riverId: context.riverId })[0];
    const center = {
      latitude: context.viewport.latitude,
      longitude: context.viewport.longitude,
    };

    const riverPath = river?.path ?? [
      { latitude: center.latitude - 0.02, longitude: center.longitude - 0.03 },
      { latitude: center.latitude, longitude: center.longitude },
      { latitude: center.latitude + 0.02, longitude: center.longitude + 0.03 },
    ];

    const all: Array<{ layerId: string; coordinates: GeoPolyline | GeoPolygon }> = [
      { layerId: GIS_LAYER_IDS.RIVERS, coordinates: riverPath },
      { layerId: GIS_LAYER_IDS.WATERSHEDS, coordinates: rectPolygon(center, 1.2) },
      {
        layerId: GIS_LAYER_IDS.QUEBRADAS,
        coordinates: [
          { latitude: center.latitude + 0.01, longitude: center.longitude - 0.02 },
          { latitude: center.latitude, longitude: center.longitude - 0.01 },
          { latitude: center.latitude - 0.01, longitude: center.longitude },
        ],
      },
      { layerId: GIS_LAYER_IDS.DISTRICTS, coordinates: rectPolygon(center, 1.6) },
      { layerId: GIS_LAYER_IDS.PROVINCES, coordinates: rectPolygon(center, 2.2) },
      { layerId: GIS_LAYER_IDS.DEPARTMENTS, coordinates: rectPolygon(center, 3) },
    ];

    return all.filter((g) => layerIds.includes(g.layerId));
  }
}

export const mockGisRepository = new MockGISRepository();
