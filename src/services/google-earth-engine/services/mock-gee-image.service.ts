/**
 * Servicio de imágenes GEE simulado — Sprint 1
 */

import type { GEEImageService } from "../interfaces";
import type { GeeImageQuery, GeeImageSummary } from "../types/gee.types";

const MOCK_IMAGES: GeeImageSummary[] = [
  {
    id: "mock-sentinel2-20250801",
    collection: "sentinel2",
    acquiredAt: "2025-08-01T15:30:00.000Z",
    cloudCover: 8.5,
  },
  {
    id: "mock-landsat8-20250728",
    collection: "landsat8",
    acquiredAt: "2025-07-28T10:12:00.000Z",
    cloudCover: 14.2,
  },
  {
    id: "mock-landsat9-20250725",
    collection: "landsat9",
    acquiredAt: "2025-07-25T10:12:00.000Z",
    cloudCover: 6.1,
  },
];

export class MockGeeImageService implements GEEImageService {
  listSupportedCollections(): Array<GeeImageQuery["collection"]> {
    return ["landsat8", "landsat9", "sentinel2"];
  }

  async searchImages(query: GeeImageQuery): Promise<GeeImageSummary[]> {
    const cloudMax = query.cloudCoverMax ?? 100;

    return MOCK_IMAGES.filter(
      (image) =>
        image.collection === query.collection &&
        image.cloudCover !== null &&
        image.cloudCover <= cloudMax
    );
  }

  async getImageMetadata(imageId: string): Promise<GeeImageSummary | null> {
    return MOCK_IMAGES.find((image) => image.id === imageId) ?? null;
  }
}
