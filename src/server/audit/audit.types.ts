/**
 * Tipos del módulo de auditoría — Sprint 3H
 */

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "EXPORT";

export type AuditEntityType =
  | "Station"
  | "Campaign"
  | "Parameter"
  | "Measurement"
  | "EnvironmentalAssessment"
  | "DataImport"
  | "ReportExport"
  | "User";

export interface AuditLogRecord {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  timestamp: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  description: string;
  responsibleUser: string;
  responsableId: string;
}

export interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  description?: string;
  responsableId?: string;
  responsableNombre?: string;
}

export interface AuditFilters {
  entityType?: string;
  action?: string;
  responsableId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  search?: string;
}

export interface AuditDiffField {
  field: string;
  previous: string;
  next: string;
  changed: boolean;
}

export interface AuditLogDetail extends AuditLogRecord {
  diff: AuditDiffField[];
}

export interface AuditSummary {
  total: number;
  byAction: Record<AuditAction, number>;
  byEntity: Record<string, number>;
  last24h: number;
  lastEventAt: string | null;
}

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  Station: "Estación",
  Campaign: "Campaña",
  Parameter: "Parámetro",
  Measurement: "Medición",
  EnvironmentalAssessment: "Evaluación ambiental",
  DataImport: "Importación",
  ReportExport: "Exportación",
  User: "Usuario",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  IMPORT: "Importación",
  EXPORT: "Exportación",
};
