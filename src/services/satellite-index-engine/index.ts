/**
 * Satellite Index Engine — DI (Sprint 4)
 */

import { SatelliteIndexEngineFactory } from "./satellite-index-engine.factory";
import type { IndexService } from "./interfaces";

let activeIndexService: IndexService | null = null;

export function getIndexService(): IndexService {
  if (!activeIndexService) {
    activeIndexService = SatelliteIndexEngineFactory.create("mock");
  }
  return activeIndexService;
}

export function setIndexService(service: IndexService): void {
  activeIndexService = service;
}

export function resetIndexService(): void {
  activeIndexService = null;
}

export { SatelliteIndexEngineFactory } from "./satellite-index-engine.factory";
export * from "./interfaces";
export * from "./types/index-engine.types";
export { INDEX_DEFINITIONS, SUPPORTED_INDEX_CODES } from "./config/index-definitions";
export {
  IndexCalculatorService,
  IndexColorScaleService,
  IndexInterpreterService,
  IndexServiceImpl,
} from "./services";
export { mockIndexRepository } from "./repositories";
export {
  NdwiIndex,
  NdviIndex,
  MndwiIndex,
  NdtiIndex,
  NdmiIndex,
} from "./strategies";
