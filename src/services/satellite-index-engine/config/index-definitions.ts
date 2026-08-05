/**
 * Definiciones de índices espectrales — Sprint 4
 */

import type { IndexDefinition } from "../types/index-engine.types";

export const INDEX_DEFINITIONS: Record<
  import("../types/index-engine.types").IndexCode,
  IndexDefinition
> = {
  NDWI: {
    code: "NDWI",
    name: "NDWI",
    description: "Normalized Difference Water Index — detecta contenido de agua superficial.",
    formula: "(Green − NIR) / (Green + NIR)",
    bands: ["B3 (Green)", "B8 (NIR)"],
    interpretationGuide: "Valores positivos indican mayor presencia de agua; negativos sugieren suelo seco o vegetación densa.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    visualizationColor: "#0891b2",
  },
  NDVI: {
    code: "NDVI",
    name: "NDVI",
    description: "Normalized Difference Vegetation Index — vigor y cobertura vegetal.",
    formula: "(NIR − Red) / (NIR + Red)",
    bands: ["B4 (Red)", "B8 (NIR)"],
    interpretationGuide: "Valores altos indican vegetación sana; valores bajos sugieren suelo desnudo o estrés hídrico.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    visualizationColor: "#16a34a",
  },
  MNDWI: {
    code: "MNDWI",
    name: "MNDWI",
    description: "Modified NDWI — mejora detección de cuerpos de agua en entornos urbanos.",
    formula: "(Green − SWIR) / (Green + SWIR)",
    bands: ["B3 (Green)", "B11 (SWIR)"],
    interpretationGuide: "Valores positivos resaltan agua abierta; útil en monitoreo de humedales y ríos.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    visualizationColor: "#059669",
  },
  NDTI: {
    code: "NDTI",
    name: "NDTI",
    description: "Normalized Difference Turbidity Index — proxy de turbidez del agua.",
    formula: "(Red − Green) / (Red + Green)",
    bands: ["B4 (Red)", "B3 (Green)"],
    interpretationGuide: "Valores elevados pueden asociarse a mayor carga de sedimentos en suspensión.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    visualizationColor: "#92400e",
  },
  NDMI: {
    code: "NDMI",
    name: "NDMI",
    description: "Normalized Difference Moisture Index — humedad de la vegetación y estrés hídrico.",
    formula: "(NIR − SWIR) / (NIR + SWIR)",
    bands: ["B8 (NIR)", "B11 (SWIR)"],
    interpretationGuide: "Valores altos indican mayor contenido de humedad en vegetación riparia.",
    expectedRange: { min: -1, max: 1 },
    unit: "adimensional",
    visualizationColor: "#7c3aed",
  },
};

export const SUPPORTED_INDEX_CODES = Object.keys(INDEX_DEFINITIONS) as Array<
  keyof typeof INDEX_DEFINITIONS
>;
