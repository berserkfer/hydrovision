import type { ComplianceStatus } from "@/types";
import type { EnvironmentalRiskLevel } from "@/types/risk";

/** Estado general de calidad del agua a nivel cuenca */
export type WatershedQualityStatus = "optimo" | "aceptable" | "alerta" | "critico";

/** Nivel de alerta ambiental ejecutiva */
export type ExecutiveAlertLevel = "normal" | "atencion" | "advertencia" | "critico";

/** Tendencia de un indicador ambiental */
export type IndicatorTrendDirection = "up" | "down" | "stable";

/** Datos del encabezado ejecutivo */
export interface ExecutiveHeaderData {
  projectName: string;
  watershedName: string;
  riverName: string;
  lastMonitoringDate: string;
  qualityStatus: WatershedQualityStatus;
  qualityStatusLabel: string;
  riskLevel: EnvironmentalRiskLevel | null;
  riskLevelLabel: string;
  riskEmoji: string;
}

/** KPIs del panel superior ejecutivo */
export interface ExecutiveKpiMetrics {
  stationCount: number;
  campaignCount: number;
  sampleCount: number;
  ecaCompliancePercent: number;
  averageRiskIndex: number;
  averageRiskLabel: string;
  lastUpdate: string;
}

/** Tarjeta de indicador ambiental */
export interface ExecutiveParameterCard {
  key: string;
  label: string;
  value: number;
  unit: string;
  status: ComplianceStatus;
  statusLabel: string;
  statusColorClass: string;
  icon: "ph" | "oxygen" | "temperature" | "conductivity" | "turbidity" | "flow";
  trend: IndicatorTrendDirection;
  trendSymbol: string;
  trendColorClass: string;
  variationPercent: number;
  sparkline: number[];
}

/** Alerta ambiental con explicación */
export interface ExecutiveAlert {
  id: string;
  level: ExecutiveAlertLevel;
  levelLabel: string;
  emoji: string;
  title: string;
  explanation: string;
}

/** Resumen ejecutivo lateral */
export interface ExecutiveSummaryData {
  watershedStatus: string;
  watershedStatusColor: string;
  criticalParameters: string[];
  alertStations: { id: string; name: string }[];
  nonCompliantCount: number;
  riskLevel: EnvironmentalRiskLevel | null;
  riskLevelLabel: string;
  riskIndex: number;
  priorityRecommendations: ExecutiveAction[];
}

/** Acción recomendada */
export interface ExecutiveAction {
  id: string;
  priority: "low" | "medium" | "high";
  text: string;
}

/** Snapshot completo del dashboard ejecutivo */
export interface ExecutiveDashboardSnapshot {
  header: ExecutiveHeaderData;
  kpis: ExecutiveKpiMetrics;
  parameterCards: ExecutiveParameterCard[];
  summary: ExecutiveSummaryData;
  alerts: ExecutiveAlert[];
  actions: ExecutiveAction[];
  evaluatedAt: string;
  isSimulated: true;
}

export const WATERSHED_QUALITY_LABELS: Record<WatershedQualityStatus, string> = {
  optimo: "Óptimo",
  aceptable: "Aceptable",
  alerta: "En alerta",
  critico: "Crítico",
};

export const EXECUTIVE_ALERT_LABELS: Record<ExecutiveAlertLevel, string> = {
  normal: "Normal",
  atencion: "Atención",
  advertencia: "Advertencia",
  critico: "Crítico",
};

export const EXECUTIVE_ALERT_EMOJI: Record<ExecutiveAlertLevel, string> = {
  normal: "🟢",
  atencion: "🟡",
  advertencia: "🟠",
  critico: "🔴",
};
