/**
 * Contrato de proveedor de capas geoespaciales — Sprint 2H
 * Implementaciones: MockLayerProvider (actual), GeeLayerProvider (futuro)
 */

import type {
  GeospatialFilters,
  GeospatialMapData,
  GeoStationDetail,
  GeospatialFilterOptions,
} from "@/types/geospatial-center";

export interface IGeospatialLayerProvider {
  readonly providerId: string;
  readonly isGeeEnabled: boolean;
  getFilterOptions(): GeospatialFilterOptions;
  getMapData(filters: GeospatialFilters): GeospatialMapData;
  getStationDetail(stationDomainId: string): GeoStationDetail | null;
}
