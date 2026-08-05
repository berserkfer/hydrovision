import type { ComplianceStatus } from "@/types";

export type ParameterCategory = "physical" | "chemical" | "microbiological";

export type ParameterCode =
  | "temperature"
  | "turbidity"
  | "conductivity"
  | "ph"
  | "dissolvedOxygen"
  | "bod5"
  | "cod"
  | "nitrates"
  | "phosphates"
  | "coliforms"
  | "coliformThermotolerant"
  | "eColi";

export type ParameterTrend = "up" | "down" | "stable";

export interface WaterParameterRecord {
  id: string;
  parameterCode: ParameterCode;
  parameterName: string;
  category: ParameterCategory;
  unit: string;
  value: number;
  ecaLimit: string;
  status: ComplianceStatus;
  trend: ParameterTrend;
  fecha: string;
  estacionId: string;
  estacionCodigo: string;
  estacionNombre: string;
  campanaId: string;
  campanaCodigo: string;
  campanaNombre: string;
  isSimulated: true;
}

export interface ParameterFilters {
  search: string;
  estacionId: string;
  campanaId: string;
  category: string;
  status: string;
  fecha: string;
}

export const DEFAULT_PARAMETER_FILTERS: ParameterFilters = {
  search: "",
  estacionId: "",
  campanaId: "",
  category: "",
  status: "",
  fecha: "",
};

export interface ParameterSummaryStats {
  total: number;
  cumple: number;
  enAlerta: number;
  noCumple: number;
}

export interface ParameterHistoryPoint {
  fecha: string;
  value: number;
  estacionCodigo: string;
  status: ComplianceStatus;
}

export interface ParameterDetailData {
  definition: import("@/lib/parameters/catalog").ParameterDefinition;
  latestValue: number;
  latestStatus: ComplianceStatus;
  latestFecha: string;
  latestEstacion: string;
  history: ParameterHistoryPoint[];
  statusDistribution: { compliant: number; alert: number; non_compliant: number };
}

export interface ParameterChartData {
  barByStation: { name: string; value: number }[];
  radarProfile: { parameter: string; value: number; fullMark: number }[];
  lineHistory: { fecha: string; value: number }[];
  campaignComparison: { campana: string; promedio: number; cumple: number }[];
}

export const PARAMETER_TREND_LABELS: Record<ParameterTrend, string> = {
  up: "↑ Al alza",
  down: "↓ A la baja",
  stable: "→ Estable",
};

export const PARAMETER_TREND_COLORS: Record<ParameterTrend, string> = {
  up: "text-amber-600",
  down: "text-cyan-600",
  stable: "text-slate-500",
};
