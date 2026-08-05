/**
 * Repository Pattern — acceso a catálogo e imágenes simuladas
 */

import type { SatelliteSearchQuery } from "../types/satellite-explorer.types";
import type { SatelliteCollection } from "./satellite-collection.interface";
import type { SatelliteImage } from "./satellite-image.interface";
import type { SatelliteMetadata } from "./satellite-metadata.interface";
import type { SatellitePlatform } from "../types/satellite-explorer.types";

export interface SatelliteRepository {
  getCollections(): SatelliteCollection[];
  getCollection(platform: SatellitePlatform): SatelliteCollection | undefined;
  getMetadata(platform: SatellitePlatform): SatelliteMetadata | undefined;
  searchImages(query: SatelliteSearchQuery): Promise<SatelliteImage[]>;
}
