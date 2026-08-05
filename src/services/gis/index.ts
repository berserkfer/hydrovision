/**
 * GIS Engine — exports y Dependency Injection (Fase 5.2)
 */

import { GISFactory } from "./gis.factory";
import type { GISEngine } from "./gis-engine";

let activeEngine: GISEngine | null = null;

export function getGISEngine(): GISEngine {
  if (!activeEngine) {
    activeEngine = GISFactory.create("mock");
  }
  return activeEngine;
}

export function setGISEngine(engine: GISEngine): void {
  activeEngine = engine;
}

export function resetGISEngine(): void {
  activeEngine = null;
}

export { GISEngine, createGISEngine } from "./gis-engine";
export { GISFactory } from "./gis.factory";
export { GISServiceImpl } from "./gis.service";
export { LeafletMapProvider, leafletMapProvider } from "./map-provider";
export * from "./interfaces";
export * from "./types";
export * from "./utils";
export * from "./config";
export * from "./repositories";
export * from "./mappers/layer.adapter";
