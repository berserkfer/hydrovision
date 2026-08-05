import type { TemporalParameterKey } from "@/types/temporal";

export interface TemporalParameterConfig {
  key: TemporalParameterKey;
  label: string;
  unit: string;
  /** true = valores altos son mejores (ej. oxígeno disuelto) */
  higherIsBetter: boolean;
  /** Variación simulada por punto */
  variance: number;
  decimals: number;
}

export const TEMPORAL_PARAMETERS: readonly TemporalParameterConfig[] = [
  { key: "ph", label: "pH", unit: "—", higherIsBetter: false, variance: 0.12, decimals: 2 },
  {
    key: "temperatura",
    label: "Temperatura",
    unit: "°C",
    higherIsBetter: false,
    variance: 0.6,
    decimals: 1,
  },
  {
    key: "conductividad",
    label: "Conductividad",
    unit: "µS/cm",
    higherIsBetter: false,
    variance: 35,
    decimals: 0,
  },
  {
    key: "oxigenoDisuelto",
    label: "Oxígeno Disuelto",
    unit: "mg/L",
    higherIsBetter: true,
    variance: 0.35,
    decimals: 2,
  },
  {
    key: "turbidez",
    label: "Turbidez",
    unit: "NTU",
    higherIsBetter: false,
    variance: 2.5,
    decimals: 1,
  },
  {
    key: "solidosDisueltos",
    label: "Sólidos Totales Disueltos",
    unit: "mg/L",
    higherIsBetter: false,
    variance: 18,
    decimals: 0,
  },
  {
    key: "caudal",
    label: "Caudal",
    unit: "m³/s",
    higherIsBetter: false,
    variance: 0.4,
    decimals: 2,
  },
] as const;

export function getTemporalParameterConfig(
  key: TemporalParameterKey
): TemporalParameterConfig {
  const config = TEMPORAL_PARAMETERS.find((p) => p.key === key);
  if (!config) throw new Error(`Parámetro temporal desconocido: ${key}`);
  return config;
}

export const DEFAULT_TEMPORAL_START = "2025-03-01";
export const DEFAULT_TEMPORAL_END = "2025-06-30";
