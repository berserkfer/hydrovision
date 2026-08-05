import type { WaterParameter } from "@/types";

export interface ECAStandard {
  parameter: WaterParameter;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  /** Porcentaje del límite para considerar "alerta" (ej. 0.8 = 80%) */
  alertThresholdRatio: number;
}

/**
 * Referencia orientativa basada en ECA agua (Perú) para cuerpos receptores.
 * Ajustar con la normativa vigente y categoría exacta del río Reque en la tesis.
 */
export const ECA_STANDARDS: ECAStandard[] = [
  {
    parameter: "ph",
    label: "pH",
    unit: "—",
    min: 6.5,
    max: 8.5,
    alertThresholdRatio: 0.9,
  },
  {
    parameter: "turbidity",
    label: "Turbidez",
    unit: "NTU",
    max: 50,
    alertThresholdRatio: 0.8,
  },
  {
    parameter: "conductivity",
    label: "Conductividad",
    unit: "µS/cm",
    max: 2500,
    alertThresholdRatio: 0.85,
  },
  {
    parameter: "dissolvedOxygen",
    label: "Oxígeno disuelto",
    unit: "mg/L",
    min: 4,
    alertThresholdRatio: 0.9,
  },
  {
    parameter: "temperature",
    label: "Temperatura",
    unit: "°C",
    max: 30,
    alertThresholdRatio: 0.85,
  },
  {
    parameter: "bod5",
    label: "DBO5",
    unit: "mg/L",
    max: 15,
    alertThresholdRatio: 0.8,
  },
  {
    parameter: "cod",
    label: "DQO",
    unit: "mg/L",
    max: 40,
    alertThresholdRatio: 0.8,
  },
  {
    parameter: "coliforms",
    label: "Coliformes",
    unit: "NMP/100mL",
    max: 1000,
    alertThresholdRatio: 0.8,
  },
];

export function getStandard(parameter: WaterParameter): ECAStandard | undefined {
  return ECA_STANDARDS.find((s) => s.parameter === parameter);
}
