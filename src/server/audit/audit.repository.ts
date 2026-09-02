/**
 * AuditRepository — persistencia de registros de auditoría — Sprint 3H
 * Los registros son append-only (solo lectura desde la UI).
 */

import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type {
  AuditAction,
  AuditEntityType,
  AuditFilters,
  AuditLogInput,
  AuditLogRecord,
  AuditSummary,
} from "./audit.types";

const mockLogs: AuditLogRecord[] = [];

function mapRow(row: {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: Date;
  previousData: unknown;
  newData: unknown;
  description: string | null;
  responsableId: string;
  responsableNombre: string | null;
}): AuditLogRecord {
  return {
    id: row.id,
    entityType: row.entityType as AuditEntityType,
    entityId: row.entityId,
    action: row.action as AuditAction,
    timestamp: row.timestamp.toISOString(),
    previousData: (row.previousData as Record<string, unknown> | null) ?? null,
    newData: (row.newData as Record<string, unknown> | null) ?? null,
    description: row.description ?? "",
    responsibleUser: row.responsableNombre ?? row.responsableId,
    responsableId: row.responsableId,
  };
}

function applyFilters(items: AuditLogRecord[], filters: AuditFilters): AuditLogRecord[] {
  let result = [...items];

  if (filters.entityType) {
    result = result.filter((r) => r.entityType === filters.entityType);
  }
  if (filters.action) {
    result = result.filter((r) => r.action === filters.action);
  }
  if (filters.responsableId) {
    result = result.filter((r) => r.responsableId === filters.responsableId);
  }
  if (filters.fechaInicio) {
    result = result.filter((r) => r.timestamp.slice(0, 10) >= filters.fechaInicio!);
  }
  if (filters.fechaFin) {
    result = result.filter((r) => r.timestamp.slice(0, 10) <= filters.fechaFin!);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.entityId.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.responsibleUser.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function toJsonValue(data: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (data == null) return undefined;
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export async function appendAuditLog(input: AuditLogInput & { id: string; responsableId: string; responsableNombre: string }): Promise<AuditLogRecord> {
  const record: AuditLogRecord = {
    id: input.id,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    timestamp: new Date().toISOString(),
    previousData: input.previousData ?? null,
    newData: input.newData ?? null,
    description: input.description ?? "",
    responsibleUser: input.responsableNombre,
    responsableId: input.responsableId,
  };

  if (isMonitoringDatabaseEnabled()) {
    try {
      const created = await prisma.auditLog.create({
        data: {
          id: input.id,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          previousData: toJsonValue(input.previousData),
          newData: toJsonValue(input.newData),
          description: input.description,
          responsableId: input.responsableId,
          responsableNombre: input.responsableNombre,
        },
      });
      return mapRow(created);
    } catch {
      // fallback to mock
    }
  }

  mockLogs.unshift(record);
  if (mockLogs.length > 500) mockLogs.pop();
  return record;
}

export async function listAuditLogs(filters: AuditFilters = {}): Promise<AuditLogRecord[]> {
  if (isMonitoringDatabaseEnabled()) {
    try {
      const where: Record<string, unknown> = {};
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.action) where.action = filters.action;
      if (filters.responsableId) where.responsableId = filters.responsableId;
      if (filters.fechaInicio || filters.fechaFin) {
        where.timestamp = {};
        if (filters.fechaInicio) {
          (where.timestamp as Record<string, Date>).gte = new Date(filters.fechaInicio);
        }
        if (filters.fechaFin) {
          (where.timestamp as Record<string, Date>).lte = new Date(`${filters.fechaFin}T23:59:59.999Z`);
        }
      }

      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: 200,
      });

      let mapped = rows.map(mapRow);
      if (filters.search) {
        mapped = applyFilters(mapped, { search: filters.search });
      }
      return mapped;
    } catch {
      // fallback
    }
  }

  return applyFilters(mockLogs, filters);
}

export async function findAuditLogById(id: string): Promise<AuditLogRecord | null> {
  if (isMonitoringDatabaseEnabled()) {
    try {
      const row = await prisma.auditLog.findUnique({ where: { id } });
      return row ? mapRow(row) : null;
    } catch {
      // fallback
    }
  }
  return mockLogs.find((l) => l.id === id) ?? null;
}

export async function buildAuditSummary(filters: AuditFilters = {}): Promise<AuditSummary> {
  const items = await listAuditLogs(filters);
  const byAction: AuditSummary["byAction"] = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    IMPORT: 0,
    EXPORT: 0,
  };
  const byEntity: Record<string, number> = {};

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  let last24h = 0;

  for (const item of items) {
    byAction[item.action] += 1;
    byEntity[item.entityType] = (byEntity[item.entityType] ?? 0) + 1;
    if (new Date(item.timestamp).getTime() >= dayAgo) last24h += 1;
  }

  return {
    total: items.length,
    byAction,
    byEntity,
    last24h,
    lastEventAt: items[0]?.timestamp ?? null,
  };
}

/** Expuesto solo para pruebas */
export function clearMockAuditLogs(): void {
  mockLogs.length = 0;
}

export function getMockAuditLogs(): AuditLogRecord[] {
  return mockLogs;
}
