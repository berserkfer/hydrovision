/**
 * GISFactory — creación del motor geoespacial (Factory Pattern)
 */

import type { GISRepository } from "./interfaces";
import { GISEngine, createGISEngine } from "./gis-engine";
import { mockGisRepository } from "./repositories";

export type GISEngineMode = "mock" | "gee" | "file";

export class GISFactory {
  static create(mode: GISEngineMode = "mock", repository?: GISRepository): GISEngine {
    switch (mode) {
      case "mock":
      default:
        return createGISEngine(repository ?? mockGisRepository);
      case "gee":
        return createGISEngine(repository ?? mockGisRepository);
      case "file":
        return createGISEngine(repository ?? mockGisRepository);
    }
  }

  static getSupportedModes(): GISEngineMode[] {
    return ["mock", "gee", "file"];
  }
}
