/**
 * Mock SatelliteRepository — Sprint 3 (sin GEE)
 */

import { SATELLITE_COLLECTIONS } from "../config/satellite-catalog";
import type { SatelliteRepository } from "../interfaces/satellite-repository.interface";
import type { SatelliteCollection } from "../interfaces/satellite-collection.interface";
import type { SatelliteImage } from "../interfaces/satellite-image.interface";
import type { SatelliteMetadata } from "../interfaces/satellite-metadata.interface";
import type { SatellitePlatform, SatelliteSearchQuery } from "../types/satellite-explorer.types";
import { generateMockSatelliteImages } from "../utils/mock-image.generator";
import { resolveExplorerViewport } from "../utils/explorer-geo.utils";

export class MockSatelliteRepository implements SatelliteRepository {
  getCollections(): SatelliteCollection[] {
    return SATELLITE_COLLECTIONS;
  }

  getCollection(platform: SatellitePlatform): SatelliteCollection | undefined {
    return SATELLITE_COLLECTIONS.find((collection) => collection.platform === platform);
  }

  getMetadata(platform: SatellitePlatform): SatelliteMetadata | undefined {
    return this.getCollection(platform)?.metadata;
  }

  async searchImages(query: SatelliteSearchQuery): Promise<SatelliteImage[]> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    const center = resolveExplorerViewport(query.watershedId, query.riverId, query.stationId);

    return generateMockSatelliteImages(query, center).sort(
      (a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
    );
  }
}

export const mockSatelliteRepository = new MockSatelliteRepository();
