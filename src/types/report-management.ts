import type { ComplianceStatus } from "@/types";

export type ReportTabId =
  | "executive"
  | "waterQuality"
  | "campaigns"
  | "stations"
  | "satellite"
  | "risk";

export interface ReportTabDefinition {
  id: ReportTabId;
  label: string;
  emoji: string;
}

export const REPORT_TABS: ReportTabDefinition[] = [
  { id: "executive", label: "Resumen Ejecutivo", emoji: "📋" },
  { id: "waterQuality", label: "Calidad del Agua", emoji: "💧" },
  { id: "campaigns", label: "Campañas", emoji: "🧪" },
  { id: "stations", label: "Estaciones", emoji: "📍" },
  { id: "satellite", label: "Índices Satelitales", emoji: "🛰️" },
  { id: "risk", label: "Riesgo Ambiental", emoji: "⚠️" },
];

export interface ReportFilters {
  cuencaId: string;
  rioId: string;
  estacionId: string;
  campanaId: string;
  fechaInicio: string;
  fechaFin: string;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  cuencaId: "",
  rioId: "",
  estacionId: "",
  campanaId: "",
  fechaInicio: "2025-01-01",
  fechaFin: "2025-08-31",
};

export interface ReportTableRow {
  id: string;
  cells: string[];
}

export interface ReportTableSection {
  title: string;
  headers: string[];
  rows: ReportTableRow[];
}

export interface ReportChartPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface ReportChartSection {
  title: string;
  description: string;
  type: "bar" | "line" | "pie";
  data: ReportChartPoint[];
}

export interface ReportSectionContent {
  tabId: ReportTabId;
  title: string;
  generatedAt: string;
  responsable: string;
  summary: string;
  conclusions: string[];
  tables: ReportTableSection[];
  charts: ReportChartSection[];
}

export interface EnvironmentalReportDocument {
  id: string;
  titulo: string;
  generatedAt: string;
  responsable: string;
  resumenGlobal: string;
  sections: Record<ReportTabId, ReportSectionContent>;
  filtersApplied: ReportFilters;
  isSimulated: true;
}

export interface ReportFilterOptions {
  cuencas: { value: string; label: string }[];
  rios: { value: string; label: string }[];
  estaciones: { value: string; label: string }[];
  campanas: { value: string; label: string }[];
}

export interface ReportExecutiveStats {
  totalEstaciones: number;
  totalCampanas: number;
  cumplimientoEca: number;
  alertasActivas: number;
  indiceRiesgoPromedio: number;
}

export type { ComplianceStatus };
