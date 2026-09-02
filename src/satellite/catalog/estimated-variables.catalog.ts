/**
 * Variables estimadas derivadas de satélite — NO mediciones directas de campo.
 */

import type { SpectralIndexCode } from "./spectral-indices.catalog";

export type EstimatedVariableCode =
  | "turbidity_estimated"
  | "chlorophyll_a_estimated"
  | "suspended_solids_estimated";

export type DerivationKind = "proxy" | "model" | "derived";

export interface EstimatedVariableDefinition {
  code: EstimatedVariableCode;
  name: string;
  unit: string;
  derivationKind: DerivationKind;
  relatedIndices: SpectralIndexCode[];
  description: string;
  /** Aviso científico obligatorio en UI/API */
  disclaimer: string;
}

export const ESTIMATED_VARIABLE_DEFINITIONS: Record<
  EstimatedVariableCode,
  EstimatedVariableDefinition
> = {
  turbidity_estimated: {
    code: "turbidity_estimated",
    name: "Turbidez estimada",
    unit: "NTU",
    derivationKind: "proxy",
    relatedIndices: ["NDTI", "MNDWI"],
    description:
      "Estimación proxy a partir de índices espectrales; no sustituye turbidez medida in-situ.",
    disclaimer:
      "Variable estimada (proxy satelital). Debe calibrarse con turbidez de campo antes de uso normativo.",
  },
  chlorophyll_a_estimated: {
    code: "chlorophyll_a_estimated",
    name: "Clorofila-a estimada",
    unit: "µg/L",
    derivationKind: "proxy",
    relatedIndices: ["NDCI", "NDVI"],
    description:
      "Proxy espectral de clorofila-a en columna de agua; requiere modelo de calibración.",
    disclaimer:
      "Variable estimada (proxy satelital). No equivale a análisis de laboratorio de clorofila-a.",
  },
  suspended_solids_estimated: {
    code: "suspended_solids_estimated",
    name: "Sólidos suspendidos estimados",
    unit: "mg/L",
    derivationKind: "model",
    relatedIndices: ["NDTI", "NDWI"],
    description:
      "Estimación futura mediante modelo calibrado campo ↔ reflectancia/índice.",
    disclaimer:
      "Variable estimada (modelo). No implementada — pendiente calibración con SST medidos en campo.",
  },
};

export const ESTIMATED_VARIABLE_CODES = Object.keys(
  ESTIMATED_VARIABLE_DEFINITIONS
) as EstimatedVariableCode[];

export function getEstimatedVariableDefinition(
  code: EstimatedVariableCode
): EstimatedVariableDefinition {
  return ESTIMATED_VARIABLE_DEFINITIONS[code];
}
