/**
 * Tipos del módulo de exportación — Sprint 3G
 */

import type { ReportChartSection } from "@/types/report-management";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportReportFilters {
  cuencaId: string;
  rioId: string;
  estacionId: string;
  campanaId: string;
  parametroCodigo: string;
  categoria: string;
  estadoAmbiental: string;
  fechaInicio: string;
  fechaFin: string;
}

export const DEFAULT_EXPORT_FILTERS: ExportReportFilters = {
  cuencaId: "",
  rioId: "",
  estacionId: "",
  campanaId: "",
  parametroCodigo: "",
  categoria: "",
  estadoAmbiental: "",
  fechaInicio: "2025-01-01",
  fechaFin: "2025-08-31",
};

export interface ExportSections {
  resumen: boolean;
  estaciones: boolean;
  mediciones: boolean;
  graficos: boolean;
  evaluacion: boolean;
  conclusiones: boolean;
}

export const DEFAULT_EXPORT_SECTIONS: ExportSections = {
  resumen: true,
  estaciones: true,
  mediciones: true,
  graficos: true,
  evaluacion: true,
  conclusiones: true,
};

export interface ExportFilterOptions {
  cuencas: { value: string; label: string }[];
  rios: { value: string; label: string }[];
  estaciones: { value: string; label: string }[];
  campanas: { value: string; label: string }[];
  parametros: { value: string; label: string; categoria: string }[];
  categorias: { value: string; label: string }[];
  estadosAmbientales: { value: string; label: string }[];
}

export interface ExportStationRow {
  codigo: string;
  nombre: string;
  rio: string;
  cuenca: string;
  tramo: string;
  latitud: number;
  longitud: number;
  estado: string;
}

export interface ExportCampaignRow {
  codigo: string;
  nombre: string;
  cuenca: string;
  rio: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  responsable: string;
}

export interface ExportParameterRow {
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  limiteEca?: number;
}

export interface ExportMeasurementRow {
  estacionCodigo: string;
  campanaCodigo: string;
  fecha: string;
  parametroCodigo: string;
  parametroNombre: string;
  categoria: string;
  valor: number;
  unidad: string;
  estadoEca: string;
}

export interface ExportEvaluationRow {
  estacionCodigo: string;
  estacionNombre: string;
  fecha: string;
  estado: string;
  indiceRiesgo: number;
  parametrosViolados: string;
  parametrosEnAlerta: string;
}

export interface ExportStatistics {
  totalRegistros: number;
  totalMediciones: number;
  totalEstaciones: number;
  totalCampanas: number;
  totalEvaluaciones: number;
  cumplimientoEcaPct: number;
  valorPromedio?: number;
  valorMin?: number;
  valorMax?: number;
  desviacionEstandar?: number;
}

export interface ExportPreviewDto {
  recordCount: number;
  dateRange: { inicio: string; fin: string } | null;
  estaciones: string[];
  parametros: string[];
  statistics: ExportStatistics;
  charts: ReportChartSection[];
  filtersApplied: ExportReportFilters;
  isEmpty: boolean;
  message?: string;
}

export interface ReportExportBundle {
  generatedAt: string;
  responsable: string;
  titulo: string;
  filters: ExportReportFilters;
  sections: ExportSections;
  preview: ExportPreviewDto;
  stations: ExportStationRow[];
  campaigns: ExportCampaignRow[];
  parameters: ExportParameterRow[];
  measurements: ExportMeasurementRow[];
  evaluations: ExportEvaluationRow[];
  charts: ReportChartSection[];
  conclusions: string[];
}

export interface ExportHistoryRecord {
  id: string;
  fileFormat: ExportFormat;
  fileName: string;
  responsableId: string;
  responsableNombre: string;
  filters: ExportReportFilters;
  sections: ExportSections | null;
  recordCount: number;
  createdAt: string;
}

export interface ExportResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  recordCount: number;
  historyId: string;
}
