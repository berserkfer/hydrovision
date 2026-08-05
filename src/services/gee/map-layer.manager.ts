/**
 * Gestor de capas del mapa — preparado para capas GEE raster/vector.
 */

import type { MapLayerDefinition } from "@/types/gee";

export interface IMapLayerManager {
  getLayers(): MapLayerDefinition[];
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  addRasterLayer(id: string, name: string): void;
}

const DEFAULT_LAYERS: MapLayerDefinition[] = [
  { id: "stations", name: "Estaciones de monitoreo", visible: true, opacity: 1, type: "marker" },
  { id: "river", name: "Cauce del río", visible: true, opacity: 0.8, type: "vector" },
  { id: "ndwi", name: "NDWI (simulado)", visible: false, opacity: 0.6, type: "raster" },
  { id: "ndvi", name: "NDVI (simulado)", visible: false, opacity: 0.6, type: "raster" },
];

export class MockMapLayerManager implements IMapLayerManager {
  private layers: MapLayerDefinition[] = [...DEFAULT_LAYERS];

  getLayers(): MapLayerDefinition[] {
    return [...this.layers];
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    this.layers = this.layers.map((l) =>
      l.id === layerId ? { ...l, visible } : l
    );
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    this.layers = this.layers.map((l) =>
      l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
    );
  }

  addRasterLayer(id: string, name: string): void {
    if (this.layers.some((l) => l.id === id)) return;
    this.layers.push({ id, name, visible: false, opacity: 0.6, type: "raster" });
  }
}

export const mapLayerManager: IMapLayerManager = new MockMapLayerManager();
