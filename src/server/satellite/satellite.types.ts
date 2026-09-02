/**
 * DTOs y respuestas API — capa satelital
 */

import type { SpectralIndexDefinition, SpectralIndexCode } from "@/satellite/catalog/spectral-indices.catalog";
import type { Sentinel2BandDefinition } from "@/satellite/catalog/sentinel2-bands.catalog";
import type { EstimatedVariableDefinition } from "@/satellite/catalog/estimated-variables.catalog";
import type { CalibrationModelContract } from "@/satellite/types/calibration.types";
import type { SatelliteObservation, SatelliteScene } from "@/satellite/types/satellite-observation.types";
import type { SourceType } from "@/satellite/types/data-origin.types";

export interface SatelliteApiMeta {
  dataSource: "database" | "mock";
  sourceType: SourceType;
  isSimulated: boolean;
  providerStatus: "stub" | "mock" | "database" | "gee";
  geeConnected: boolean;
  geeLive?: boolean;
  message?: string;
}

export interface SatelliteQueryFilters {
  stationId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  indexCode?: SpectralIndexCode;
  /** Si true y GEE configurado, consulta escenas Sentinel-2 en vivo */
  useGee?: boolean;
}

export interface SatelliteObservationsResponse {
  observations: SatelliteObservation[];
  meta: SatelliteApiMeta;
}

export interface SatelliteIndicesCatalogResponse {
  indices: SpectralIndexDefinition[];
  meta: SatelliteApiMeta;
}

export interface SatelliteScenesResponse {
  scenes: SatelliteScene[];
  meta: SatelliteApiMeta;
}

export interface SatelliteCatalogResponse {
  bands: Sentinel2BandDefinition[];
  indices: SpectralIndexDefinition[];
  estimatedVariables: EstimatedVariableDefinition[];
  calibrationModels: CalibrationModelContract[];
  meta: SatelliteApiMeta;
}
