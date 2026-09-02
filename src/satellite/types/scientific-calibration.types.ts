/**
 * Contratos de auditoría y calibración exploratoria campo ↔ Sentinel-2.
 * NO persistencia, NO ML, NO producción automática.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { TemporalDifferenceStatistics } from "./scientific-dataset.types";

export type CalibrationReadinessStatus =
  | "READY"
  | "INSUFFICIENT_REAL_DATA"
  | "INSUFFICIENT_PARAMETER_COVERAGE"
  | "INSUFFICIENT_STATION_COVERAGE"
  | "INSUFFICIENT_TEMPORAL_COVERAGE"
  | "INSUFFICIENT_INDEX_COVERAGE"
  | "DATA_QUALITY_FAILURE"
  | "READY_WITH_WARNINGS";

export type ModelValidationStatus =
  | "not_attempted"
  | "trained"
  | "validated"
  | "failed"
  | "insufficient_data";

export interface ParameterCoverageEntry {
  parameterCode: ParametroCodigoDb;
  totalPairs: number;
  realPairs: number;
  acceptedRealPairs: number;
  simulatedPairs: number;
  readiness: CalibrationReadinessStatus;
  candidateIndices: SpectralIndexCode[];
  warnings: string[];
}

export interface StationCoverageEntry {
  stationId: string;
  realPairs: number;
  shareOfRealPairs: number;
}

export interface TemporalCoverage {
  start: string | null;
  end: string | null;
  days: number;
  independentPeriods: number;
}

export interface MissingValuesReport {
  nullFieldValues: number;
  nullPredictorIndices: number;
  nullSatelliteDates: number;
}

export interface IndexAvailabilityEntry {
  index: SpectralIndexCode;
  availableCount: number;
  nullCount: number;
}

export interface CalibrationReadinessResult {
  status: CalibrationReadinessStatus;
  reasons: string[];
  warnings: string[];
  meetsMinimumExploratoryCriteria: boolean;
}

export interface ScientificDatasetAuditReport {
  totalPairs: number;
  realPairs: number;
  simulatedPairs: number;

  stationCount: number;
  campaignCount: number;
  sampleCount: number;
  measurementCount: number;
  sceneCount: number;

  parameterCoverage: ParameterCoverageEntry[];
  stationCoverage: StationCoverageEntry[];

  temporalCoverage: TemporalCoverage;

  missingValues: MissingValuesReport;
  duplicatePairs: number;
  invalidMeasurements: number;

  temporalDifferenceStatistics: TemporalDifferenceStatistics;
  indexAvailability: IndexAvailabilityEntry[];

  calibrationReadiness: CalibrationReadinessResult;
}

export interface RegressionMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface TemporalSplitInfo {
  trainingPeriod: { start: string; end: string };
  validationPeriod: { start: string; end: string };
  splitRule: string;
}

export interface ScientificCalibrationModel {
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;

  modelType: "linear_regression";

  coefficientA: number;
  coefficientB: number;

  trainingSampleCount: number;
  validationSampleCount: number;

  trainingMetrics: RegressionMetrics;
  validationMetrics: RegressionMetrics;

  temporalSplit: TemporalSplitInfo;

  stationCount: number;

  validationStatus: ModelValidationStatus;
  warnings: string[];

  scientificStatus: "exploratory_calibration";
  disclaimer: string;
}

/** Fila observacional para futura exportación — sin predicciones */
export interface ScientificCalibrationDatasetRow {
  station_id: string;
  field_sample_id: string;
  field_measurement_id: string;
  parameter_code: string;
  field_value: number;
  field_unit: string;
  field_date: string;
  satellite_scene_id: string | null;
  satellite_acquisition_date: string | null;
  temporal_difference_days: number | null;
  distance_meters: number | null;
  predictor_index_name: SpectralIndexCode;
  predictor_index_value: number | null;
  quality_status: string;
  is_simulated: boolean;
}

export interface CalibrationAuditMeta {
  scientificStatus: "descriptive_only" | "exploratory_calibration";
  dataSource: "database" | "mock";
  isSimulated: boolean;
  geeConnected: boolean;
  readinessCriteriaDisclaimer: string;
}

export interface CalibrationAuditResponse {
  audit: ScientificDatasetAuditReport;
  readiness: Record<ParametroCodigoDb, CalibrationReadinessResult> & {
    overall: CalibrationReadinessResult;
  };
  candidateParameters: ParametroCodigoDb[];
  meta: CalibrationAuditMeta;
}

export interface CalibrationRunRequest {
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
  stationId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface CalibrationRunSuccessResponse {
  model: ScientificCalibrationModel;
  audit: ScientificDatasetAuditReport;
  meta: CalibrationAuditMeta;
}

export interface CalibrationInsufficientDataResponse {
  status: CalibrationReadinessStatus | ExploratoryValidationStatus;
  message: string;
  audit: ScientificDatasetAuditReport;
  readiness: CalibrationReadinessResult;
  scientificStatus: "descriptive_only";
}

// --- Prompt 8: Validación científica exploratoria ---

export type ExploratoryValidationStatus =
  | "VALIDATED_EXPLORATORY"
  | "VALIDATED_WITH_WARNINGS"
  | "INSUFFICIENT_VALIDATION_DATA"
  | "TEMPORAL_LEAKAGE"
  | "INVALID_MODEL"
  | "SIMULATED_DATA"
  | "NOT_VALIDATED";

export type RobustnessStatus =
  | "robust_exploratory"
  | "warning"
  | "insufficient_data"
  | "invalid";

export interface TrainingValidationComparison {
  r2Gap: number | null;
  maeRatio: number | null;
  rmseRatio: number | null;
  possibleOverfittingSignal: boolean;
}

export interface DataDiscardReasons {
  simulated: number;
  nullPredictor: number;
  invalidFieldValue: number;
  duplicate: number;
  notAccepted: number;
  wrongParameter: number;
}

export interface DataQualityReport {
  totalInputPairs: number;
  effectiveObservationsUsed: number;
  discardedCount: number;
  discardReasons: DataDiscardReasons;
}

export interface ScientificCalibrationValidationResult {
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
  modelType: "linear_regression";

  coefficientA: number;
  coefficientB: number;
  coefficientSign: "positive" | "negative" | "zero";

  trainingMetrics: RegressionMetrics;
  validationMetrics: RegressionMetrics;
  trainingSampleCount: number;
  validationSampleCount: number;

  trainingDateRange: { start: string; end: string };
  validationDateRange: { start: string; end: string };
  temporalLeakageCheck: "passed" | "failed";

  stationCount: number;
  dominantStationShare: number;
  stationDistribution: StationCoverageEntry[];

  trainingValidationComparison: TrainingValidationComparison;
  dataQuality: DataQualityReport;

  modelTrainingStatus: ModelValidationStatus;
  validationStatus: ExploratoryValidationStatus;
  robustnessStatus: RobustnessStatus;

  warnings: string[];
  scientificStatus: "validated_exploratory";
  disclaimer: string;
}

export interface ScientificCalibrationValidationExportRow {
  parameter_code: string;
  predictor_index: string;
  n_training: number;
  n_validation: number;
  training_mae: number;
  training_rmse: number;
  training_r2: number;
  validation_mae: number;
  validation_rmse: number;
  validation_r2: number;
  coefficient_a: number;
  coefficient_b: number;
  validation_status: ExploratoryValidationStatus;
  robustness_status: RobustnessStatus;
  warnings: string;
}

export interface CalibrationValidateMeta {
  scientificStatus: "validated_exploratory" | "descriptive_only";
  isSimulated: boolean;
  dataSource: "database" | "mock";
  geeConnected: boolean;
  validationCriteriaDisclaimer: string;
}

export interface CalibrationValidateSuccessResponse {
  model: ScientificCalibrationModel;
  validation: ScientificCalibrationValidationResult;
  audit: ScientificDatasetAuditReport;
  scientificStatus: "validated_exploratory";
  meta: CalibrationValidateMeta;
  disclaimer: string;
}

export interface CalibrationValidateInsufficientResponse {
  status: ExploratoryValidationStatus | CalibrationReadinessStatus;
  message: string;
  validation: ScientificCalibrationValidationResult | null;
  audit: ScientificDatasetAuditReport;
  scientificStatus: "descriptive_only";
}
