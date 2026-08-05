import type { ExecutiveParameterCard } from "@/types/executive";

export type ExecutiveParameterKey = ExecutiveParameterCard["key"];

export interface ExecutiveParameterDef {
  key: ExecutiveParameterKey;
  label: string;
  unit: string;
  icon: ExecutiveParameterCard["icon"];
  /** Campo en FieldMeasurement o derivado */
  measurementField:
    | "ph"
    | "dissolvedOxygen"
    | "temperature"
    | "conductivity"
    | "turbidity"
    | "flowRate";
  ecaParameter?: "ph" | "dissolvedOxygen" | "temperature" | "conductivity" | "turbidity";
  variance: number;
  decimals: number;
}

export const EXECUTIVE_PARAMETERS: readonly ExecutiveParameterDef[] = [
  {
    key: "ph",
    label: "pH",
    unit: "—",
    icon: "ph",
    measurementField: "ph",
    ecaParameter: "ph",
    variance: 0.12,
    decimals: 2,
  },
  {
    key: "dissolvedOxygen",
    label: "Oxígeno Disuelto",
    unit: "mg/L",
    icon: "oxygen",
    measurementField: "dissolvedOxygen",
    ecaParameter: "dissolvedOxygen",
    variance: 0.35,
    decimals: 2,
  },
  {
    key: "temperature",
    label: "Temperatura",
    unit: "°C",
    icon: "temperature",
    measurementField: "temperature",
    ecaParameter: "temperature",
    variance: 0.5,
    decimals: 1,
  },
  {
    key: "conductivity",
    label: "Conductividad",
    unit: "µS/cm",
    icon: "conductivity",
    measurementField: "conductivity",
    ecaParameter: "conductivity",
    variance: 30,
    decimals: 0,
  },
  {
    key: "turbidity",
    label: "Turbidez",
    unit: "NTU",
    icon: "turbidity",
    measurementField: "turbidity",
    ecaParameter: "turbidity",
    variance: 2,
    decimals: 1,
  },
  {
    key: "flowRate",
    label: "Caudal",
    unit: "m³/s",
    icon: "flow",
    measurementField: "flowRate",
    variance: 0.3,
    decimals: 2,
  },
] as const;
