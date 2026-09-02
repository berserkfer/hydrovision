/**
 * Servicio GEE real — búsqueda de imágenes Sentinel-2 vía GeeAdapter.
 * NO calcula índices; solo metadata de escenas.
 */

import type { GEEImageService } from "../interfaces";
import type { GeeImageQuery, GeeImageSummary } from "../types/gee.types";
import { GeeAdapter } from "@/server/gee/gee.adapter";
import { getEarthEngineAuthService, getEarthEngineTokenManager } from "../auth";

export class RealGeeImageService implements GEEImageService {
  private readonly adapter: GeeAdapter;

  constructor() {
    const authService = getEarthEngineAuthService();
    this.adapter = new GeeAdapter(
      getEarthEngineTokenManager(),
      undefined,
      () => authService.isInitialized()
    );
  }

  listSupportedCollections(): Array<GeeImageQuery["collection"]> {
    return ["sentinel2"];
  }

  async searchImages(query: GeeImageQuery): Promise<GeeImageSummary[]> {
    if (query.collection !== "sentinel2") {
      return [];
    }

    const auth = getEarthEngineAuthService();
    if (!auth.isInitialized()) {
      await auth.initialize();
    }

    const scenes = await this.adapter.searchSentinel2Scenes({
      latitude: -6.75,
      longitude: -79.85,
      startDate: query.startDate,
      endDate: query.endDate,
      cloudCoverMax: query.cloudCoverMax,
    });

    return scenes.map((scene) => ({
      id: scene.sceneId,
      collection: "sentinel2",
      acquiredAt: `${scene.acquisitionDate}T12:00:00.000Z`,
      cloudCover: scene.cloudPercentage,
    }));
  }

  async getImageMetadata(imageId: string): Promise<GeeImageSummary | null> {
    const images = await this.searchImages({
      collection: "sentinel2",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
    return images.find((img) => img.id === imageId) ?? null;
  }
}
