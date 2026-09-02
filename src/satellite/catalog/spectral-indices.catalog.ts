/**
 * Catálogo centralizado de índices espectrales — Sentinel-2.
 * Fórmulas estándar documentadas; cálculo local solo con reflectancias provistas.
 * NO sustituye procesamiento GEE ni validación con datos de campo.
 */

import {
  maxSpatialResolution,
  type Sentinel2BandCode,
  type Sentinel2ReflectanceMap,
} from "./sentinel2-bands.catalog";

export type SpectralIndexCode = "NDVI" | "NDCI" | "NDWI" | "MNDWI" | "NDTI" | "NDMI";

export interface SpectralIndexDefinition {
  code: SpectralIndexCode;
  name: string;
  description: string;
  /** Fórmula legible */
  formula: string;
  /** Expresión con códigos de banda Sentinel-2 */
  formulaExpression: string;
  bands: Sentinel2BandCode[];
  interpretationGuide: string;
  expectedRange: { min: number; max: number };
  unit: "adimensional";
  waterApplicable: boolean;
  visualizationColor: string;
}

function normalizedDifference(a: number, b: number): number {
  const denominator = a + b;
  if (denominator === 0) return 0;
  return (a - b) / denominator;
}

function getReflectance(map: Sentinel2ReflectanceMap, band: Sentinel2BandCode): number | null {
  const value = map[band];
  return value === undefined ? null : value;
}

export const SPECTRAL_INDEX_DEFINITIONS: Record<SpectralIndexCode, SpectralIndexDefinition> = {
  NDVI: {
    code: "NDVI",
    name: "NDVI",
    description: "Normalized Difference Vegetation Index — vigor y cobertura vegetal riparia.",
    formula: "(NIR − Red) / (NIR + Red)",
    formulaExpression: "(B08 − B04) / (B08 + B04)",
    bands: ["B08", "B04"],
    interpretationGuide:
      "Valores altos indican vegetación densa; no representa calidad química del agua.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: false,
    visualizationColor: "#16a34a",
  },
  NDCI: {
    code: "NDCI",
    name: "NDCI",
    description:
      "Normalized Difference Chlorophyll Index — proxy de clorofila-a en columna de agua.",
    formula: "(Red Edge − Red) / (Red Edge + Red)",
    formulaExpression: "(B05 − B04) / (B05 + B04)",
    bands: ["B05", "B04"],
    interpretationGuide:
      "Proxy espectral de clorofila-a; requiere calibración con muestreos de campo. No es medición directa.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: true,
    visualizationColor: "#0d9488",
  },
  NDWI: {
    code: "NDWI",
    name: "NDWI",
    description: "Normalized Difference Water Index (McFeeters) — presencia de agua superficial.",
    formula: "(Green − NIR) / (Green + NIR)",
    formulaExpression: "(B03 − B08) / (B03 + B08)",
    bands: ["B03", "B08"],
    interpretationGuide: "Valores positivos sugieren mayor presencia de agua abierta.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: true,
    visualizationColor: "#0891b2",
  },
  MNDWI: {
    code: "MNDWI",
    name: "MNDWI",
    description: "Modified NDWI (Xu & Han) — detección de agua en entornos complejos.",
    formula: "(Green − SWIR) / (Green + SWIR)",
    formulaExpression: "(B03 − B11) / (B03 + B11)",
    bands: ["B03", "B11"],
    interpretationGuide: "Útil para delimitar cuerpos de agua; no equivale a turbidez medida in-situ.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: true,
    visualizationColor: "#059669",
  },
  NDTI: {
    code: "NDTI",
    name: "NDTI",
    description: "Normalized Difference Turbidity Index — proxy de turbidez/sedimentos en suspensión.",
    formula: "(Red − Green) / (Red + Green)",
    formulaExpression: "(B04 − B03) / (B04 + B03)",
    bands: ["B04", "B03"],
    interpretationGuide:
      "Proxy de turbidez; correlación con turbidez de campo debe establecerse mediante calibración.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: true,
    visualizationColor: "#92400e",
  },
  NDMI: {
    code: "NDMI",
    name: "NDMI",
    description: "Normalized Difference Moisture Index — humedad en vegetación riparia.",
    formula: "(NIR − SWIR) / (NIR + SWIR)",
    formulaExpression: "(B08 − B11) / (B08 + B11)",
    bands: ["B08", "B11"],
    interpretationGuide: "Indica humedad de vegetación marginal; no sustituye oxígeno disuelto medido.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    waterApplicable: false,
    visualizationColor: "#7c3aed",
  },
};

export const SPECTRAL_INDEX_CODES = Object.keys(
  SPECTRAL_INDEX_DEFINITIONS
) as SpectralIndexCode[];

export function getSpectralIndexDefinition(code: SpectralIndexCode): SpectralIndexDefinition {
  return SPECTRAL_INDEX_DEFINITIONS[code];
}

export function getIndexSpatialResolution(code: SpectralIndexCode): number {
  return maxSpatialResolution(SPECTRAL_INDEX_DEFINITIONS[code].bands);
}

/**
 * Calcula un índice a partir de reflectancias provistas.
 * Retorna null si faltan bandas requeridas (sin inventar valores).
 */
export function computeSpectralIndex(
  code: SpectralIndexCode,
  reflectanceMap: Sentinel2ReflectanceMap
): number | null {
  switch (code) {
    case "NDVI": {
      const nir = getReflectance(reflectanceMap, "B08");
      const red = getReflectance(reflectanceMap, "B04");
      if (nir === null || red === null) return null;
      return Number(normalizedDifference(nir, red).toFixed(6));
    }
    case "NDCI": {
      const re = getReflectance(reflectanceMap, "B05");
      const red = getReflectance(reflectanceMap, "B04");
      if (re === null || red === null) return null;
      return Number(normalizedDifference(re, red).toFixed(6));
    }
    case "NDWI": {
      const green = getReflectance(reflectanceMap, "B03");
      const nir = getReflectance(reflectanceMap, "B08");
      if (green === null || nir === null) return null;
      return Number(normalizedDifference(green, nir).toFixed(6));
    }
    case "MNDWI": {
      const green = getReflectance(reflectanceMap, "B03");
      const swir = getReflectance(reflectanceMap, "B11");
      if (green === null || swir === null) return null;
      return Number(normalizedDifference(green, swir).toFixed(6));
    }
    case "NDTI": {
      const red = getReflectance(reflectanceMap, "B04");
      const green = getReflectance(reflectanceMap, "B03");
      if (red === null || green === null) return null;
      return Number(normalizedDifference(red, green).toFixed(6));
    }
    case "NDMI": {
      const nir = getReflectance(reflectanceMap, "B08");
      const swir = getReflectance(reflectanceMap, "B11");
      if (nir === null || swir === null) return null;
      return Number(normalizedDifference(nir, swir).toFixed(6));
    }
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
