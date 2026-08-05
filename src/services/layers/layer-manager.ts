/**
 * LayerManager — orquestador del gestor de capas geoespaciales.
 * Punto de entrada desacoplado de la UI.
 */

import type { MapCenter } from "@/types/geography";
import type { GeoRiver } from "@/types/geography";
import type { LayerManagerSnapshot, ManagedLayer, RasterBounds, VectorGeometry } from "@/types/layers";
import { getGISEngine } from "@/services/gis";
import { layerRepository } from "./layer.repository";
import { layerService } from "./layer.service";

export interface LayerManagerContext {
  river: GeoRiver;
  center: MapCenter;
}

export class LayerManager {
  private layers: ManagedLayer[];

  constructor(initialLayers?: ManagedLayer[]) {
    this.layers = initialLayers ?? layerService.createInitialState();
  }

  getSnapshot(): LayerManagerSnapshot {
    return layerService.buildSnapshot(this.layers);
  }

  getLayers(): ManagedLayer[] {
    return [...this.layers];
  }

  toggleLayer(layerId: string): void {
    this.layers = layerService.toggleVisibility(this.layers, layerId);
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    this.layers = layerService.setVisibility(this.layers, layerId, visible);
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    this.layers = layerService.setOpacity(this.layers, layerId, opacity);
  }

  resetLayers(): void {
    this.layers = layerService.resetAll(this.layers);
  }

  getVectorGeometries(context: LayerManagerContext): VectorGeometry[] {
    return layerRepository.getVectorGeometries(context.river, context.center);
  }

  getRasterBounds(center: MapCenter): RasterBounds[] {
    return layerRepository.getRasterBounds(center);
  }

  /** Preparado para capas GEE — registrar capa raster externa */
  registerGeeRasterLayer(id: string, name: string, description: string): void {
    if (this.layers.some((l) => l.id === id)) return;

    getGISEngine().registerGeeLayer(id, name, description);

    this.layers.push({
      id,
      name,
      description,
      kind: "raster",
      category: "satellite",
      colorRamp: ["#000000", "#ffffff"],
      visible: false,
      opacity: 0.6,
      zIndex: 25,
      isSimulated: true,
      source: "google_earth_engine",
      legend: [{ label: name, color: "#0891b2" }],
    });
  }
}

export const createLayerManager = (): LayerManager => new LayerManager();
