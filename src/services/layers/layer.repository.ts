/**
 * LayerRepository — delega catálogo al GIS Engine (Fase 5.2)
 */

import type { MapCenter } from "@/types/geography";
import type { GeoRiver } from "@/types/geography";
import type { ManagedLayer, RasterBounds, VectorGeometry } from "@/types/layers";
import { getGISEngine, toManagedLayers } from "@/services/gis";
import { GIS_LAYER_CATALOG } from "@/services/gis/config";

export class LayerRepository {
  getCatalog(): ManagedLayer[] {
    return toManagedLayers(
      GIS_LAYER_CATALOG.map((layer) => ({ ...layer }))
    );
  }

  getVectorGeometries(river: GeoRiver, center: MapCenter): VectorGeometry[] {
    return getGISEngine().getLegacyVectorGeometries(river, center);
  }

  getRasterBounds(center: MapCenter): RasterBounds[] {
    return getGISEngine().getLegacyRasterBounds(center);
  }

  getLayerById(id: string): ManagedLayer | undefined {
    return this.getCatalog().find((l) => l.id === id);
  }
}

export const layerRepository = new LayerRepository();
