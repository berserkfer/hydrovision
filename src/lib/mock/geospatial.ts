/**
 * Mock geoespacial — Sprint 2H (delegación al layer provider)
 */

export {
  getGeospatialLayerProvider,
  mockGeospatialLayerProvider,
} from "@/lib/geospatial";

import { getGeospatialLayerProvider } from "@/lib/geospatial";
import type { GeospatialFilters } from "@/types/geospatial-center";

const provider = getGeospatialLayerProvider();

export function getMockGeospatialFilterOptions() {
  return provider.getFilterOptions();
}

export function getMockGeospatialMapData(filters: GeospatialFilters) {
  return provider.getMapData(filters);
}

export function getMockGeospatialStationDetail(domainId: string) {
  return provider.getStationDetail(domainId);
}
