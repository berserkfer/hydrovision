/**
 * Cliente API — Auditoría (Sprint 3H)
 */

import { apiGet } from "./client";
import type { AuditFilters, AuditLogDetail, AuditLogRecord, AuditSummary } from "@/server/audit/audit.types";

export async function fetchAuditLogs(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (filters.responsableId) params.set("responsableId", filters.responsableId);
  if (filters.fechaInicio) params.set("fechaInicio", filters.fechaInicio);
  if (filters.fechaFin) params.set("fechaFin", filters.fechaFin);
  if (filters.search) params.set("search", filters.search);

  const qs = params.toString();
  return apiGet<{ items: AuditLogRecord[]; summary: AuditSummary }>(
    `/api/audit${qs ? `?${qs}` : ""}`
  );
}

export async function fetchAuditDetail(id: string): Promise<AuditLogDetail> {
  return apiGet<AuditLogDetail>(`/api/audit/${id}`);
}
