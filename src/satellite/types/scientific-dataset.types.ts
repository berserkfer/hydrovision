/**
 * Contratos del dataset científico campo ↔ Sentinel-2.
 * DESCRIPTIVO — sin predicción, correlación ni coeficientes.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { ScientificDatasetQualityReport } from "../quality/dataset-quality-metrics";
import type { GeeEmpiricalVerificationReport } from "./gee-verification.types";
import type { FieldSatelliteMatchingStatus } from "./field-satellite-match.types";
import type { CandidateRelationshipRef } from "./field-satellite-comparison.types";

export const SCIENTIFIC_DATASET_DISCLAIMER =
  "Este dataset contiene pares operacionalmente compatibles entre mediciones de campo y observaciones Sentinel-2. Su inclusión NO implica equivalencia física, correlación estadística ni capacidad predictiva. La calibración y validación científica requieren datos reales, control de calidad, suficiente tamaño muestral y evaluación estadística independiente." as const;

export type ScientificPairQualityStatus =
  | "accepted"
  | "rejected"
  | "insufficient_data"
  | "simulated_data"
  | "temporal_mismatch"
  | "spatial_mismatch"
  | "missing_index"
  | "invalid_measurement";

export interface SpectralIndicesSnapshot {
  ndvi: number | null;
  ndci: number | null;
  ndwi: number | null;
  mndwi: number | null;
  ndti: number | null;
  ndmi: number | null;
}

/** Una pareja campo ↔ satélite candidata para análisis/calibración futura */
export interface ScientificFieldSatellitePair {
  id: string;
  stationId: string;
  fieldSampleId: string;
  /** Trazabilidad compuesta sampleId + parameterCode */
  fieldMeasurementId: string;
  parameterCode: ParametroCodigoDb;
  fieldValue: number;
  fieldUnit: string;
  fieldDate: string;
  satelliteObservationId: string | null;
  satelliteSceneId: string | null;
  satelliteAcquisitionDate: string | null;
  spectralIndices: SpectralIndicesSnapshot;
  temporalDifferenceDays: number | null;
  distanceMeters: number | null;
  matchingStatus: FieldSatelliteMatchingStatus;
  qualityStatus: ScientificPairQualityStatus;
  sourceTypeField: "field";
  sourceTypeSatellite: "satellite";
  isSimulated: boolean;
  scientificStatus: "descriptive_only";
  candidateRelationships: CandidateRelationshipRef[];
  rejectionReason?: string;
  createdAt: string;
}

export interface TemporalDifferenceStatistics {
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  count: number;
}

export interface ScientificDatasetDateRange {
  fieldDateMin: string | null;
  fieldDateMax: string | null;
  satelliteDateMin: string | null;
  satelliteDateMax: string | null;
}

export interface ScientificDatasetSummary {
  totalPairs: number;
  acceptedPairs: number;
  rejectedPairs: number;
  simulatedPairs: number;
  insufficientPairs: number;
  excludedSimulatedPairs: number;
  stationsCount: number;
  parametersCount: number;
  scenesCount: number;
  dateRange: ScientificDatasetDateRange;
  temporalDifferenceStatistics: TemporalDifferenceStatistics;
  qualityBreakdown: Record<ScientificPairQualityStatus, number>;
}

/** Fila plana para futura exportación CSV — sin columnas predictivas */
export interface ScientificDatasetExportRow {
  station_id: string;
  field_sample_id: string;
  field_measurement_id: string;
  parameter_code: string;
  field_value: number;
  field_unit: string;
  field_date: string;
  satellite_observation_id: string | null;
  satellite_scene_id: string | null;
  satellite_acquisition_date: string | null;
  temporal_difference_days: number | null;
  distance_meters: number | null;
  ndvi: number | null;
  ndci: number | null;
  ndwi: number | null;
  mndwi: number | null;
  ndti: number | null;
  ndmi: number | null;
  matching_status: FieldSatelliteMatchingStatus;
  quality_status: ScientificPairQualityStatus;
  is_simulated: boolean;
  scientific_status: "descriptive_only";
}

export interface ScientificDatasetMeta {
  scientificStatus: "descriptive_only";
  isSimulated: boolean;
  dataSource: "database" | "mock";
  geeConnected: boolean;
  geeLive: boolean;
  includeSimulated: boolean;
  disclaimer: string;
}

export interface ParameterDatasetReadinessSummary {
  parameterCode: ParametroCodigoDb;
  realAcceptedPairs: number;
  stations: number;
  temporalPeriods: number;
  acceptedRate: number;
  readinessStatus: string;
  meetsMinimumExploratoryCriteria: boolean;
}

export interface ScientificDatasetResponse {
  pairs: ScientificFieldSatellitePair[];
  summary: ScientificDatasetSummary;
  meta: ScientificDatasetMeta;
  qualityReport?: ScientificDatasetQualityReport;
  parameterReadiness?: ParameterDatasetReadinessSummary[];
  geeVerification?: GeeEmpiricalVerificationReport;
}
