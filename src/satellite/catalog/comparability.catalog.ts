/**
 * Catálogo de comparabilidad campo / satélite / modelo.
 * Las relaciones campo↔índice son CANDIDATAS — no equivalencias.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "./spectral-indices.catalog";
import type { EstimatedVariableCode } from "./estimated-variables.catalog";

export type ComparabilityCategory = "field_measured" | "spectral_index" | "model_estimated";

export interface FieldComparableParameter {
  code: ParametroCodigoDb;
  category: "field_measured";
  name: string;
  unit: string;
  description: string;
}

export interface SpectralComparableIndex {
  code: SpectralIndexCode;
  category: "spectral_index";
  name: string;
  unit: "adimensional";
  waterApplicable: boolean;
}

export interface ModelComparableVariable {
  code: EstimatedVariableCode;
  category: "model_estimated";
  name: string;
  status: "not_calibrated";
  disclaimer: string;
}

/** Relación candidata para exploración futura — NO equivalencia */
export interface CandidateRelationshipDefinition {
  id: string;
  fieldParameterCode: ParametroCodigoDb;
  potentialExplanatoryIndices: SpectralIndexCode[];
  relationshipKind: "candidate_relationship";
  disclaimer: string;
}

const CANDIDATE_DISCLAIMER =
  "Relación candidata para calibración futura. No implica que el índice mida directamente la variable de campo.";

export const CANDIDATE_RELATIONSHIPS: CandidateRelationshipDefinition[] = [
  {
    id: "cand-turbidity-ndti",
    fieldParameterCode: "turbidity",
    potentialExplanatoryIndices: ["NDTI", "MNDWI"],
    relationshipKind: "candidate_relationship",
    disclaimer: `${CANDIDATE_DISCLAIMER} Turbidez (NTU) vs NDTI.`,
  },
  {
    id: "cand-nutrients-ndci",
    fieldParameterCode: "phosphates",
    potentialExplanatoryIndices: ["NDCI", "NDVI"],
    relationshipKind: "candidate_relationship",
    disclaimer: `${CANDIDATE_DISCLAIMER} Fosfatos vs NDCI — exploración futura, no clorofila-a medida.`,
  },
  {
    id: "cand-water-presence-ndwi",
    fieldParameterCode: "flow_rate",
    potentialExplanatoryIndices: ["NDWI", "MNDWI"],
    relationshipKind: "candidate_relationship",
    disclaimer: `${CANDIDATE_DISCLAIMER} Presencia de agua superficial — no caudal hidrométrico.`,
  },
  {
    id: "cand-conductivity-context",
    fieldParameterCode: "conductivity",
    potentialExplanatoryIndices: ["NDWI"],
    relationshipKind: "candidate_relationship",
    disclaimer: `${CANDIDATE_DISCLAIMER} Sin relación establecida; índice incluido solo como contexto espacial.`,
  },
];

export function getCandidateRelationshipsForParameter(
  parameterCode: ParametroCodigoDb
): CandidateRelationshipDefinition[] {
  return CANDIDATE_RELATIONSHIPS.filter((r) => r.fieldParameterCode === parameterCode);
}

export function isFieldDirectlyComparable(_parameterCode: ParametroCodigoDb): boolean {
  return true;
}

export function isSpectralIndexDirectlyComparable(_indexCode: SpectralIndexCode): boolean {
  return true;
}

export function isModelVariableCalibrated(_code: EstimatedVariableCode): false {
  return false;
}
