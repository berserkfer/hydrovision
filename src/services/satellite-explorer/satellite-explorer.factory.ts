/**
 * Factory — Explorador Satelital (mock | gee)
 */

import type { SatelliteSearchService } from "./interfaces";
import { mockSatelliteRepository } from "./repositories";
import { MockSatelliteSearchService } from "./services";

export type SatelliteExplorerMode = "mock" | "gee";

export class SatelliteExplorerFactory {
  static create(mode: SatelliteExplorerMode = "mock"): SatelliteSearchService {
    switch (mode) {
      case "gee":
        return new MockSatelliteSearchService(mockSatelliteRepository);
      case "mock":
      default:
        return new MockSatelliteSearchService(mockSatelliteRepository);
    }
  }
}
