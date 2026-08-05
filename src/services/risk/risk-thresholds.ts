/**
 * Umbrales de referencia para evaluación de riesgo ambiental.
 * Alineados orientativamente con ECA Perú — extensibles en fases futuras.
 */

import type { RiskParameterKey } from "@/types/risk";

export interface ParameterThreshold {
  key: RiskParameterKey;
  label: string;
  unit: string;
  weight: number;
  /** Tipo de evaluación */
  mode: "range" | "max" | "min";
  optimalMin?: number;
  optimalMax?: number;
  warningMin?: number;
  warningMax?: number;
  criticalMin?: number;
  criticalMax?: number;
}

export const RISK_PARAMETER_THRESHOLDS: ParameterThreshold[] = [
  {
    key: "ph",
    label: "pH",
    unit: "—",
    weight: 0.15,
    mode: "range",
    optimalMin: 6.8,
    optimalMax: 8.2,
    warningMin: 6.5,
    warningMax: 8.5,
    criticalMin: 6.0,
    criticalMax: 9.0,
  },
  {
    key: "temperatura",
    label: "Temperatura",
    unit: "°C",
    weight: 0.1,
    mode: "max",
    optimalMax: 26,
    warningMax: 30,
    criticalMax: 35,
  },
  {
    key: "oxigenoDisuelto",
    label: "Oxígeno disuelto",
    unit: "mg/L",
    weight: 0.2,
    mode: "min",
    optimalMin: 6,
    warningMin: 4,
    criticalMin: 2,
  },
  {
    key: "conductividad",
    label: "Conductividad",
    unit: "µS/cm",
    weight: 0.15,
    mode: "max",
    optimalMax: 500,
    warningMax: 1500,
    criticalMax: 2500,
  },
  {
    key: "turbidez",
    label: "Turbidez",
    unit: "NTU",
    weight: 0.15,
    mode: "max",
    optimalMax: 20,
    warningMax: 35,
    criticalMax: 50,
  },
  {
    key: "solidosDisueltos",
    label: "Sólidos disueltos",
    unit: "mg/L",
    weight: 0.15,
    mode: "max",
    optimalMax: 500,
    warningMax: 800,
    criticalMax: 1200,
  },
  {
    key: "caudal",
    label: "Caudal",
    unit: "m³/s",
    weight: 0.1,
    mode: "range",
    optimalMin: 1.5,
    optimalMax: 8,
    warningMin: 0.5,
    warningMax: 12,
    criticalMin: 0.2,
    criticalMax: 15,
  },
];

export function getThreshold(key: RiskParameterKey): ParameterThreshold {
  const t = RISK_PARAMETER_THRESHOLDS.find((p) => p.key === key);
  if (!t) throw new Error(`Umbral no definido: ${key}`);
  return t;
}
