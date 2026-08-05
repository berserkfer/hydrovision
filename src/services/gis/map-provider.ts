/**
 * LeafletMapProvider — configuración de mapa agnóstica (Fase 5.2)
 */

import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/components/map/map-config";
import type { MapProvider } from "./interfaces";
import type { LatLng, MapViewport } from "./types";
import { gisEngineConfig } from "./config";
import { fromLeafletTuple, toLeafletTuple } from "./utils";

export class LeafletMapProvider implements MapProvider {
  getDefaultViewport(): MapViewport {
    return { ...gisEngineConfig.defaultCenter, crs: "EPSG:4326" };
  }

  getCoordinateSystem(): "EPSG:4326" {
    return "EPSG:4326";
  }

  getTileConfig(): { url: string; attribution: string } {
    return { url: MAP_TILE_URL, attribution: MAP_TILE_ATTRIBUTION };
  }

  toMapCoordinates(latlng: LatLng): [number, number] {
    return toLeafletTuple(latlng);
  }

  fromMapCoordinates(coords: [number, number]): LatLng {
    return fromLeafletTuple(coords);
  }
}

export const leafletMapProvider = new LeafletMapProvider();
