/**
 * Resultado descriptivo de comparación campo ↔ satélite.
 * scientificStatus siempre "descriptive_only" en esta fase — sin predicción ni correlación.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { FieldSatelliteMatchingStatus } from "./field-satellite-match.types";
import type { PixelQualityStatus } from "../quality/pixel-quality";
import type { ReflectanceSemanticStatus } from "@/server/gee/gee-band.mapper";
import type { SpatialRepresentativeness } from "@/server/gee/gee.adapter.types";

export type FieldSatelliteScientificStatus = "descriptive_only" | "not_available" | "insufficient_data";

export interface FieldComparisonSide {
  parameterCode: ParametroCodigoDb;
  value: number | null;
  unit: string;
  date: string;
  sampleId: string;
  sourceType: "field";
  isSimulated: boolean;
}

export interface SatelliteComparisonSide {
  acquisitionDate: string | null;
  sceneId: string | null;
  observationId: string | null;
  indices: Partial<Record<SpectralIndexCode, number>>;
  cloudPercentage: number | null;
  reflectanceSemanticStatus?: ReflectanceSemanticStatus | null;
  pixelQualityStatus?: PixelQualityStatus | null;
  spatialRepresentativeness?: SpatialRepresentativeness;
  collection?: string | null;
  tileId?: string | null;
  systemTimeStart?: number | null;
  sourceType: "satellite";
  isSimulated: boolean;
}

export interface ComparisonMatchingInfo {
  status: FieldSatelliteMatchingStatus;
  temporalDifferenceDays: number | null;
  distanceMeters: number | null;
  operationallyCompatible: boolean;
}

/** Relación candidata — NO equivalencia ni correlación establecida */
export interface CandidateRelationshipRef {
  fieldParameterCode: ParametroCodigoDb;
  potentialExplanatoryIndices: SpectralIndexCode[];
  relationshipKind: "candidate_relationship";
  disclaimer: string;
}

export interface FieldSatelliteComparison {
  stationId: string;
  field: FieldComparisonSide;
  satellite: SatelliteComparisonSide;
  matching: ComparisonMatchingInfo;
  candidateRelationships: CandidateRelationshipRef[];
  scientificStatus: FieldSatelliteScientificStatus;
  disclaimers: string[];
}

export const DESCRIPTIVE_ONLY_DISCLAIMER =
  "Comparación descriptiva entre medición de campo e índices espectrales. No establece equivalencia, correlación ni capacidad predictiva." as const;

export const NO_PREDICTION_DISCLAIMER =
  "HydroVision no convierte índices espectrales en concentraciones de contaminantes en esta fase." as const;
