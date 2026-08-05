/**
 * Mock SatelliteSearchService — Sprint 3
 */

import { SATELLITE_COLLECTIONS } from "../config/satellite-catalog";
import type { SatelliteSearchService } from "../interfaces/satellite-search.service.interface";
import type { SatelliteRepository } from "../interfaces/satellite-repository.interface";
import type { SatelliteMetadata } from "../interfaces/satellite-metadata.interface";
import type {
  ExplorerFilterOptions,
  SatellitePlatform,
  SatelliteSearchQuery,
  SatelliteSearchResult,
} from "../types/satellite-explorer.types";
import { getExplorerFilterOptions } from "../utils/explorer-geo.utils";

export class MockSatelliteSearchService implements SatelliteSearchService {
  constructor(private readonly repository: SatelliteRepository) {}

  getFilterOptions(query: Partial<SatelliteSearchQuery>): ExplorerFilterOptions {
    const watershedId = query.watershedId ?? "cuenca-reque";
    const riverId = query.riverId ?? "rio-reque";
    const geoOptions = getExplorerFilterOptions(watershedId, riverId);

    return {
      ...geoOptions,
      satellites: SATELLITE_COLLECTIONS.map((collection) => ({
        value: collection.platform,
        label: collection.comingSoon
          ? `${collection.metadata.displayName} (Próximamente)`
          : `${collection.metadata.displayName} (Activo)`,
        available: collection.isActive,
      })),
    };
  }

  getMetadata(platform: SatellitePlatform): SatelliteMetadata | undefined {
    return this.repository.getMetadata(platform);
  }

  validateQuery(query: SatelliteSearchQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.watershedId) errors.push("Seleccione una cuenca.");
    if (!query.riverId) errors.push("Seleccione un río.");
    if (!query.startDate) errors.push("Indique la fecha inicial.");
    if (!query.endDate) errors.push("Indique la fecha final.");

    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      errors.push("La fecha inicial no puede ser posterior a la fecha final.");
    }

    const collection = this.repository.getCollection(query.satellite);
    if (!collection?.isActive) {
      errors.push("La plataforma seleccionada aún no está disponible.");
    }

    return { isValid: errors.length === 0, errors };
  }

  async search(query: SatelliteSearchQuery): Promise<SatelliteSearchResult> {
    const validation = this.validateQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(" "));
    }

    const images = await this.repository.searchImages(query);

    return {
      query,
      images,
      total: images.length,
      searchedAt: new Date().toISOString(),
      source: "simulated",
    };
  }
}
