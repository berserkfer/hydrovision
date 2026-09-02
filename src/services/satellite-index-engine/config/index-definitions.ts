/**
 * Definiciones de índices espectrales — reexporta catálogo canónico satelital.
 * @see src/satellite/catalog/spectral-indices.catalog.ts
 */

import {
  SPECTRAL_INDEX_DEFINITIONS,
  type SpectralIndexCode,
} from "@/satellite/catalog/spectral-indices.catalog";
import type { IndexDefinition } from "../types/index-engine.types";

/** Índices usados por Satellite Index Engine (sin NDCI por compatibilidad de UI existente) */
export type IndexCode = Exclude<SpectralIndexCode, "NDCI">;

function toEngineDefinition(code: IndexCode): IndexDefinition {
  const def = SPECTRAL_INDEX_DEFINITIONS[code];
  return {
    code,
    name: def.name,
    description: def.description,
    formula: def.formula,
    bands: def.bands.map((b) => `${b}`),
    interpretationGuide: def.interpretationGuide,
    expectedRange: def.expectedRange,
    unit: def.unit,
    visualizationColor: def.visualizationColor,
  };
}

export const INDEX_DEFINITIONS: Record<IndexCode, IndexDefinition> = {
  NDWI: toEngineDefinition("NDWI"),
  NDVI: toEngineDefinition("NDVI"),
  MNDWI: toEngineDefinition("MNDWI"),
  NDTI: toEngineDefinition("NDTI"),
  NDMI: toEngineDefinition("NDMI"),
};

export const SUPPORTED_INDEX_CODES = Object.keys(INDEX_DEFINITIONS) as IndexCode[];
