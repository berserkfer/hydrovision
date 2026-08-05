/**
 * LayerService — operaciones de estado sobre capas (visibilidad, opacidad).
 */

import type { LayerManagerSnapshot, ManagedLayer } from "@/types/layers";
import { layerRepository } from "./layer.repository";

export class LayerService {
  createInitialState(): ManagedLayer[] {
    return layerRepository.getCatalog();
  }

  toggleVisibility(layers: ManagedLayer[], layerId: string): ManagedLayer[] {
    return layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
  }

  setVisibility(layers: ManagedLayer[], layerId: string, visible: boolean): ManagedLayer[] {
    return layers.map((l) => (l.id === layerId ? { ...l, visible } : l));
  }

  setOpacity(layers: ManagedLayer[], layerId: string, opacity: number): ManagedLayer[] {
    const clamped = Math.max(0, Math.min(1, opacity));
    return layers.map((l) => (l.id === layerId ? { ...l, opacity: clamped } : l));
  }

  resetAll(layers: ManagedLayer[]): ManagedLayer[] {
    const catalog = layerRepository.getCatalog();
    return catalog.map((defaultLayer) => {
      const current = layers.find((l) => l.id === defaultLayer.id);
      return current ? { ...defaultLayer } : defaultLayer;
    });
  }

  buildSnapshot(layers: ManagedLayer[]): LayerManagerSnapshot {
    const visibleLayers = layers.filter((l) => l.visible);

    return {
      layers,
      visibleLayers,
      getLayer: (id) => layers.find((l) => l.id === id),
      isVisible: (id) => layers.find((l) => l.id === id)?.visible ?? false,
      getOpacity: (id) => layers.find((l) => l.id === id)?.opacity ?? 1,
    };
  }
}

export const layerService = new LayerService();
