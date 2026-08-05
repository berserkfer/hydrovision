/**
 * GISService — lógica de capas, filtros, leyendas y escalas (Fase 5.2)
 */

import type { GISRepository, GISService, MapLayer } from "./interfaces";
import type { BoundingBox, LatLng, MapScale, SpatialFilter } from "./types";
import { computeAutoZoom, computeBoundingBox } from "./utils";

export class GISServiceImpl implements GISService {
  private layers: MapLayer[];

  constructor(private readonly repository: GISRepository, initialLayers?: MapLayer[]) {
    this.layers = initialLayers ?? repository.getMapLayers();
  }

  getLayers(): MapLayer[] {
    return this.layers.map((l) => ({ ...l }));
  }

  getVisibleLayers(): MapLayer[] {
    return this.layers.filter((l) => l.visible).map((l) => ({ ...l }));
  }

  toggleLayer(layerId: string): MapLayer[] {
    this.layers = this.layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    return this.getLayers();
  }

  setLayerVisibility(layerId: string, visible: boolean): MapLayer[] {
    this.layers = this.layers.map((l) => (l.id === layerId ? { ...l, visible } : l));
    return this.getLayers();
  }

  setLayerOpacity(layerId: string, opacity: number): MapLayer[] {
    const clamped = Math.max(0, Math.min(1, opacity));
    this.layers = this.layers.map((l) => (l.id === layerId ? { ...l, opacity: clamped } : l));
    return this.getLayers();
  }

  resetLayers(): MapLayer[] {
    this.layers = this.repository.getMapLayers();
    return this.getLayers();
  }

  selectLayers(layerIds: string[]): MapLayer[] {
    const idSet = new Set(layerIds);
    this.layers = this.layers.map((l) => ({
      ...l,
      visible: idSet.has(l.id),
    }));
    return this.getLayers();
  }

  applySpatialFilter(filter: SpatialFilter) {
    return {
      watersheds: this.repository.getWatersheds().filter(
        (w) => !filter.watershedId || w.id === filter.watershedId
      ),
      rivers: this.repository.getRivers(filter),
      stations: this.repository.getMonitoringStations(filter),
    };
  }

  computeAutoZoom(bbox: BoundingBox): number {
    return computeAutoZoom(bbox);
  }

  computeBoundingBox(points: LatLng[]): BoundingBox {
    return computeBoundingBox(points);
  }

  getLegend(layerId: string) {
    return this.layers.find((l) => l.id === layerId)?.legend ?? [];
  }

  getScale(zoom: number, latitude = -6.7): MapScale {
    const metersPerPixel =
      (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
    const ratio = Math.round(metersPerPixel * 100 * 3779.527559);
    return {
      zoom,
      metersPerPixel: Number(metersPerPixel.toFixed(2)),
      ratio: `1:${ratio.toLocaleString("es-PE")}`,
    };
  }

  addExternalLayer(layer: MapLayer): void {
    if (this.layers.some((l) => l.id === layer.id)) return;
    this.layers.push(layer);
  }
}
