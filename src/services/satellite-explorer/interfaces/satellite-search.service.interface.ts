/**
 * Servicio de búsqueda satelital — Sprint 3
 */

import type { ExplorerFilterOptions, SatelliteSearchQuery, SatelliteSearchResult } from "../types/satellite-explorer.types";
import type { SatelliteMetadata } from "./satellite-metadata.interface";
import type { SatellitePlatform } from "../types/satellite-explorer.types";

export interface SatelliteSearchService {
  getFilterOptions(query: Partial<SatelliteSearchQuery>): ExplorerFilterOptions;
  getMetadata(platform: SatellitePlatform): SatelliteMetadata | undefined;
  search(query: SatelliteSearchQuery): Promise<SatelliteSearchResult>;
  validateQuery(query: SatelliteSearchQuery): { isValid: boolean; errors: string[] };
}
