import type { ComplianceStatus } from "@/types";

export type EnvironmentalRiskLevel = "bajo" | "moderado" | "alto" | "muy_alto";
export type EnvironmentalSemaphore = "green" | "yellow" | "red";

export interface EnvironmentalEvaluationFilters {
  estacionId: string;
  campanaId: string;
}

export const DEFAULT_EVALUATION_FILTERS: EnvironmentalEvaluationFilters = {
  estacionId: "",
  campanaId: "",
};

export interface EnvironmentalGeneralStatus {
  estadoGeneral: string;
  nivelRiesgo: EnvironmentalRiskLevel;
  nivelRiesgoLabel: string;
  semaforo: EnvironmentalSemaphore;
  fechaEvaluacion: string;
}

export interface EnvironmentalIndicatorCard {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  trend: "up" | "down" | "stable";
  status: ComplianceStatus | "neutral";
}

export interface EnvironmentalStationSummary {
  nombre: string;
  codigo: string;
  rio: string;
  cuenca: string;
  coordenadas: string;
  ultimaCampana: string;
  responsable: string;
}

export interface CriticalParameterRow {
  id: string;
  parametro: string;
  valor: number;
  unidad: string;
  limiteEca: string;
  estado: ComplianceStatus;
}

export interface TemporalTrendPoint {
  fecha: string;
  ph: number;
  oxigenoDisuelto: number;
  turbidez: number;
  conductividad: number;
}

export interface EnvironmentalDiagnosisResult {
  mensaje: string;
  nivelConfianza: number;
  reglasAplicadas: string[];
}

export interface EnvironmentalRecommendationItem {
  id: string;
  prioridad: "baja" | "media" | "alta";
  texto: string;
}

export interface EnvironmentalEvaluationDocument {
  id: string;
  titulo: string;
  filters: EnvironmentalEvaluationFilters;
  generalStatus: EnvironmentalGeneralStatus;
  indicators: EnvironmentalIndicatorCard[];
  stationSummary: EnvironmentalStationSummary;
  criticalParameters: CriticalParameterRow[];
  temporalTrends: TemporalTrendPoint[];
  diagnosis: EnvironmentalDiagnosisResult;
  recommendations: EnvironmentalRecommendationItem[];
  isSimulated: true;
}

export interface EnvironmentalEvaluationOptions {
  estaciones: { value: string; label: string }[];
  campanas: { value: string; label: string }[];
}

export const SEMAPHORE_LABELS: Record<EnvironmentalSemaphore, string> = {
  green: "Favorable",
  yellow: "Precaución",
  red: "Crítico",
};

export const RISK_LEVEL_LABELS: Record<EnvironmentalRiskLevel, string> = {
  bajo: "Bajo",
  moderado: "Moderado",
  alto: "Alto",
  muy_alto: "Muy alto",
};
