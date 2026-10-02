/**
 * Contratos del endpoint de predicción — extiende (no reemplaza) la calibración exploratoria.
 * Toda predicción exitosa expone N, métricas de validación e incertidumbre heurística.
 * Ninguna predicción se fabrica: sin modelo validado, se retorna un error tipado con motivo.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "@/satellite/catalog/spectral-indices.catalog";
import type {
  LiteratureModelCalibrationMetrics,
  LiteratureModelCitation,
} from "@/satellite/literature-models/literature-model.types";
import type {
  CalibrationReadinessStatus,
  ExploratoryValidationStatus,
  RegressionMetrics,
  ScientificDatasetAuditReport,
  TemporalSplitInfo,
} from "@/satellite/types/scientific-calibration.types";

export type PredictionInsufficientStatus =
  | CalibrationReadinessStatus
  | ExploratoryValidationStatus
  | "MODELING_TARGET_NOT_ENABLED"
  | "NO_RECENT_OBSERVATION"
  | "NO_PREDICTOR_VALUE"
  | "INVALID_REQUEST";

export interface PredictionSampleSizeReport {
  parameterCode: ParametroCodigoDb;
  realPairs: number;
  acceptedRealPairs: number;
  simulatedPairs: number;
  trainingSampleCount: number | null;
  validationSampleCount: number | null;
}

export interface PredictionUncertaintyBand {
  lower: number;
  upper: number;
  /** Rótulo explícito — NO es un intervalo de confianza estadístico */
  method: string;
}

export interface PredictionSourceObservation {
  provider: "copernicus" | "gee" | "planetary" | "database" | "mock";
  acquisitionDate: string;
  sceneId: string | null;
  predictorValue: number;
  isSimulated: boolean;
}

export interface PredictionModelSummary {
  modelType: "linear_regression";
  coefficientA: number;
  coefficientB: number;
  trainingSampleCount: number;
  validationSampleCount: number;
  trainingMetrics: RegressionMetrics;
  validationMetrics: RegressionMetrics;
  temporalSplit: TemporalSplitInfo;
}

export interface PredictionSuccessResult {
  status: "PREDICTED";
  stationId: string;
  parameterCode: ParametroCodigoDb;
  predictorIndex: SpectralIndexCode;
  predictedValue: number;
  unit: string;
  uncertainty: PredictionUncertaintyBand | null;
  observation: PredictionSourceObservation;
  model: PredictionModelSummary;
  sampleSize: PredictionSampleSizeReport;
  isSimulated: boolean;
  scientificStatus: "predicted_exploratory";
  disclaimer: string;
}

export interface PredictionLiteratureModelResult {
  status: "PREDICTED_LITERATURE_MODEL";
  stationId: string;
  parameterCode: ParametroCodigoDb;
  predictedValue: number;
  unit: string;
  observation: PredictionSourceObservation;
  literatureModel: {
    modelCode: string;
    citation: LiteratureModelCitation;
    calibrationContext: string;
    transferabilityWarning: string;
    formulaDescription: string;
    calibrationMetrics: LiteratureModelCalibrationMetrics;
  };
  /** Estado de la calibración LOCAL (siempre expuesto — nunca se oculta que N local es insuficiente) */
  localCalibration: {
    status: PredictionInsufficientStatus;
    message: string;
    sampleSize: PredictionSampleSizeReport;
  };
  isSimulated: boolean;
  scientificStatus: "literature_reference_model";
  disclaimer: string;
}

export interface PredictionInsufficientPayload {
  status: PredictionInsufficientStatus;
  message: string;
  stationId: string;
  parameterCode: ParametroCodigoDb;
  sampleSize: PredictionSampleSizeReport;
  audit?: ScientificDatasetAuditReport;
  scientificStatus: "descriptive_only";
}

export interface PredictionRequest {
  stationId: string;
  parameterCode: ParametroCodigoDb;
  predictorIndex?: SpectralIndexCode;
  fechaInicio?: string;
  fechaFin?: string;
  useGee?: boolean;
  useCopernicus?: boolean;
  usePlanetaryComputer?: boolean;
}

export const PREDICTION_DISCLAIMERS = {
  exploratory:
    "Predicción puntual generada por una calibración exploratoria (regresión lineal). No constituye una medición de campo ni un pronóstico validado independientemente.",
  uncertainty:
    "La banda de incertidumbre es una heurística basada en el RMSE del conjunto de validación temporal (±RMSE). NO es un intervalo de confianza estadístico ni asume una distribución de error conocida.",
  n:
    "El tamaño muestral (N) usado para entrenar/validar este modelo se reporta explícitamente junto con R², RMSE y MAE — revíselos antes de interpretar el valor predicho.",
} as const;

export const UNCERTAINTY_HEURISTIC_METHOD_LABEL =
  "±RMSE de validación temporal (heurístico, no es un intervalo de confianza estadístico)" as const;
