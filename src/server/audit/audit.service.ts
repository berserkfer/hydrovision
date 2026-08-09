/**
 * AuditService — orquestación de trazabilidad — Sprint 3H
 */

import { getDataStore } from "@/data/store-access";
import {
  appendAuditLog,
  buildAuditSummary,
  findAuditLogById,
  listAuditLogs,
} from "./audit.repository";
import { computeAuditDiff, summarizeDiff, toAuditPayload } from "./audit-diff";
import type {
  AuditEntityType,
  AuditFilters,
  AuditLogDetail,
  AuditLogInput,
  AuditLogRecord,
  AuditSummary,
} from "./audit.types";
import { resolveDefaultResponsable } from "@/server/reports/report.repository";

export class AuditService {
  async log(input: AuditLogInput): Promise<AuditLogRecord> {
    const responsable = input.responsableId
      ? { id: input.responsableId, nombre: input.responsableNombre ?? input.responsableId }
      : await resolveDefaultResponsable();

    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return appendAuditLog({
      ...input,
      id,
      responsableId: responsable.id,
      responsableNombre: responsable.nombre,
      previousData: input.previousData ?? null,
      newData: input.newData ?? null,
      description: input.description ?? this.defaultDescription(input),
    });
  }

  async recordCreate(
    entityType: AuditEntityType,
    entityId: string,
    newData: unknown,
    description?: string
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: "CREATE",
      newData: toAuditPayload(newData),
      description,
    });
  }

  async recordUpdate(
    entityType: AuditEntityType,
    entityId: string,
    previousData: unknown,
    newData: unknown,
    description?: string
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: "UPDATE",
      previousData: toAuditPayload(previousData),
      newData: toAuditPayload(newData),
      description,
    });
  }

  async recordDelete(
    entityType: AuditEntityType,
    entityId: string,
    previousData: unknown,
    description?: string
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: "DELETE",
      previousData: toAuditPayload(previousData),
      newData: null,
      description,
    });
  }

  async recordImport(payload: {
    importId: string;
    fileName: string;
    importedRows: number;
    rejectedRows: number;
    totalRows: number;
    status: string;
    responsableId?: string;
    responsableNombre?: string;
  }): Promise<void> {
    await this.log({
      entityType: "DataImport",
      entityId: payload.importId,
      action: "IMPORT",
      newData: {
        fileName: payload.fileName,
        importedRows: payload.importedRows,
        rejectedRows: payload.rejectedRows,
        totalRows: payload.totalRows,
        status: payload.status,
      },
      description: `Importación ${payload.fileName}: ${payload.importedRows} aceptados, ${payload.rejectedRows} rechazados`,
      responsableId: payload.responsableId,
      responsableNombre: payload.responsableNombre,
    });
  }

  async recordExport(payload: {
    exportId: string;
    fileFormat: string;
    fileName: string;
    recordCount: number;
    filters: unknown;
    responsableId?: string;
    responsableNombre?: string;
  }): Promise<void> {
    await this.log({
      entityType: "ReportExport",
      entityId: payload.exportId,
      action: "EXPORT",
      newData: {
        fileFormat: payload.fileFormat,
        fileName: payload.fileName,
        recordCount: payload.recordCount,
        filters: payload.filters,
      },
      description: `Exportación ${payload.fileFormat.toUpperCase()}: ${payload.recordCount} registros`,
      responsableId: payload.responsableId,
      responsableNombre: payload.responsableNombre,
    });
  }

  async recordEnvironmentalAssessmentForStation(stationId: string, reason: string): Promise<void> {
    const store = getDataStore();
    const clasif = store.clasificaciones.find((c) => c.estacionId === stationId);
    if (!clasif) return;

    await this.log({
      entityType: "EnvironmentalAssessment",
      entityId: clasif.id,
      action: "UPDATE",
      newData: toAuditPayload(clasif),
      description: reason,
    });
  }

  list(filters: AuditFilters = {}): Promise<AuditLogRecord[]> {
    return listAuditLogs(filters);
  }

  async getById(id: string): Promise<AuditLogDetail | null> {
    const record = await findAuditLogById(id);
    if (!record) return null;

    const diff = summarizeDiff(computeAuditDiff(record.previousData, record.newData));
    return { ...record, diff };
  }

  summary(filters: AuditFilters = {}): Promise<AuditSummary> {
    return buildAuditSummary(filters);
  }

  computeDiff(previous: Record<string, unknown> | null, next: Record<string, unknown> | null) {
    return computeAuditDiff(previous, next);
  }

  private defaultDescription(input: AuditLogInput): string {
    return `${input.action} en ${input.entityType} (${input.entityId})`;
  }
}

export const auditService = new AuditService();
