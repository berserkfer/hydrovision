/**
 * GISEngine — motor geoespacial central (Fase 5.2)
 */

import type { GeoRiver, MapCenter } from "@/types/geography";
import type { RasterBounds, VectorGeometry } from "@/types/layers";
import type { GISRepository, GISService, MapLayer, MapProvider } from "./interfaces";
import type { MapViewport, SpatialFilter } from "./types";
import { GISServiceImpl } from "./gis.service";
import { LeafletMapProvider } from "./map-provider";
import { mockGisRepository } from "./repositories";
import { GIS_LAYER_IDS } from "./config";
import { gisGeometriesToLegacy, gisRasterToLegacyBounds } from "./mappers/layer.adapter";
import { computeBoundingBox, polylineLengthKm } from "./utils";

export interface GISEngineContext {
  riverId: string;
  viewport: MapViewport;
}

export class GISEngine {
  constructor(
    private readonly repository: GISRepository,
    private readonly service: GISService,
    private readonly mapProvider: MapProvider
  ) {}

  /** Repositorio de datos geoespaciales */
  getRepository(): GISRepository {
    return this.repository;
  }

  /** Servicio de lógica GIS */
  getService(): GISService {
    return this.service;
  }

  /** Proveedor de mapa */
  getMapProvider(): MapProvider {
    return this.mapProvider;
  }

  getLayers(): MapLayer[] {
    return this.service.getLayers();
  }

  getWatersheds() {
    return this.repository.getWatersheds();
  }

  getRivers(filter?: SpatialFilter) {
    return this.repository.getRivers(filter);
  }

  getMonitoringStations(filter?: SpatialFilter) {
    return this.repository.getMonitoringStations(filter);
  }

  getSatelliteImages(filter?: SpatialFilter) {
    return this.repository.getSatelliteImages(filter);
  }

  applySpatialFilter(filter: SpatialFilter) {
    return this.service.applySpatialFilter(filter);
  }

  /** Geometrías vectoriales en formato legacy para Leaflet UI */
  getLegacyVectorGeometries(river: GeoRiver, center: MapCenter): VectorGeometry[] {
    const viewport: MapViewport = {
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: center.zoom,
      crs: "EPSG:4326",
    };

    const geometries = this.repository.getVectorGeometries(
      [
        GIS_LAYER_IDS.RIVERS,
        GIS_LAYER_IDS.WATERSHEDS,
        GIS_LAYER_IDS.DISTRICTS,
        GIS_LAYER_IDS.PROVINCES,
        GIS_LAYER_IDS.DEPARTMENTS,
      ],
      { riverId: river.id, viewport }
    );

    return gisGeometriesToLegacy(geometries);
  }

  /** Bounds raster en formato legacy para Leaflet UI */
  getLegacyRasterBounds(center: MapCenter): RasterBounds[] {
    const viewport: MapViewport = {
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: center.zoom,
    };
    return gisRasterToLegacyBounds(this.repository.getRasterLayers(viewport));
  }

  computeRiverLength(riverId: string): number {
    const river = this.repository.getRivers({ riverId })[0];
    return river ? polylineLengthKm(river.path) : 0;
  }

  computeStationsBBox(riverId: string) {
    const stations = this.repository.getMonitoringStations({ riverId });
    return computeBoundingBox(stations.map((s) => s.position));
  }

  getAutoZoomViewport(riverId: string): MapViewport {
    const bbox = this.computeStationsBBox(riverId);
    return {
      latitude: (bbox.southWest.latitude + bbox.northEast.latitude) / 2,
      longitude: (bbox.southWest.longitude + bbox.northEast.longitude) / 2,
      zoom: this.service.computeAutoZoom(bbox),
      crs: "EPSG:4326",
    };
  }

  /** Preparado GEE — registrar capa raster externa */
  registerGeeLayer(id: string, name: string, description: string): void {
    (this.service as GISServiceImpl).addExternalLayer({
      id,
      name,
      description,
      type: "raster",
      visible: false,
      opacity: 0.6,
      zIndex: 25,
      legend: [{ label: name, color: "#0891b2" }],
      metadata: {
        isSimulated: true,
        source: "google_earth_engine",
        crs: "EPSG:4326",
        category: "satellite",
        format: "geotiff",
      },
    });
  }
}

export function createGISEngine(
  repository: GISRepository = mockGisRepository,
  mapProvider: MapProvider = new LeafletMapProvider()
): GISEngine {
  const service = new GISServiceImpl(repository);
  return new GISEngine(repository, service, mapProvider);
}
