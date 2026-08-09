/**
 * Tipos del módulo de importación — Sprint 3F
 */

export type ImportField =
  | "station_code"
  | "station"
  | "date"
  | "parameter"
  | "value"
  | "unit"
  | "latitude"
  | "longitude"
  | "campaign"
  | "observations"
  | "skip";

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  station_code: "Código de estación",
  station: "Nombre de estación",
  date: "Fecha de muestreo",
  parameter: "Parámetro",
  value: "Valor medido",
  unit: "Unidad",
  latitude: "Latitud",
  longitude: "Longitud",
  campaign: "Campaña",
  observations: "Observaciones",
  skip: "Ignorar columna",
};

export type RowValidationStatus = "valid" | "warning" | "error";

export interface ParsedFileResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  columnCount: number;
}

export interface ColumnMapping {
  [fileColumn: string]: ImportField;
}

export interface NormalizedImportRow {
  rowIndex: number;
  stationCode?: string;
  stationName?: string;
  date?: string;
  parameter?: string;
  value?: number;
  unit?: string;
  latitude?: number;
  longitude?: number;
  campaign?: string;
  observations?: string;
}

export interface RowValidationResult {
  rowIndex: number;
  status: RowValidationStatus;
  messages: string[];
  normalized: NormalizedImportRow;
}

export interface ImportValidationSummary {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: RowValidationResult[];
}

export interface ImportExecuteResult {
  importId: string;
  importedRows: number;
  rejectedRows: number;
  status: "completed" | "partial" | "failed";
  message: string;
}

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  fileSize: number;
  responsableNombre: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}
