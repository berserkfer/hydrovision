/**
 * Satellite Explorer — DI (Sprint 3)
 */

import { SatelliteExplorerFactory } from "./satellite-explorer.factory";
import type { SatelliteSearchService } from "./interfaces";

let activeSearchService: SatelliteSearchService | null = null;

export function getSatelliteSearchService(): SatelliteSearchService {
  if (!activeSearchService) {
    activeSearchService = SatelliteExplorerFactory.create("mock");
  }
  return activeSearchService;
}

export function setSatelliteSearchService(service: SatelliteSearchService): void {
  activeSearchService = service;
}

export function resetSatelliteSearchService(): void {
  activeSearchService = null;
}

export { SatelliteExplorerFactory } from "./satellite-explorer.factory";
export * from "./interfaces";
export * from "./types";
export { mockSatelliteRepository } from "./repositories";
export { MockSatelliteSearchService } from "./services";
export {
  SATELLITE_COLLECTIONS,
  EXPLORER_BASEMAPS,
  DEFAULT_EXPLORER_QUERY,
  EXPLORER_ZOOM,
} from "./config/satellite-catalog";
export {
  resolveExplorerViewport,
  getExplorerFilterOptions,
} from "./utils/explorer-geo.utils";
export {
  formatDisplayDate,
  formatStatusLabel,
} from "./utils/mock-image.generator";
