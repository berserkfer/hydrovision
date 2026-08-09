/**
 * Cliente API — Exportación y reportes (Sprint 3G)
 */

import { apiGet, apiPost } from "./client";
import type {
  ExportFilterOptions,
  ExportFormat,
  ExportHistoryRecord,
  ExportPreviewDto,
  ExportReportFilters,
  ExportSections,
} from "@/server/reports/report.types";

export async function fetchExportFilterOptions(): Promise<ExportFilterOptions> {
  return apiGet<ExportFilterOptions>("/api/reports/filters");
}

export async function previewExport(filters: ExportReportFilters): Promise<ExportPreviewDto> {
  return apiPost<ExportPreviewDto>("/api/reports/preview", filters);
}

export async function exportReport(payload: {
  filters: ExportReportFilters;
  format: ExportFormat;
  sections: ExportSections;
}): Promise<{ blob: Blob; fileName: string; recordCount: number; exportId: string }> {
  const response = await fetch("/api/reports/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message ?? "Error al exportar datos");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const fileName = match?.[1] ?? `hydrovision-export.${payload.format}`;
  const recordCount = Number(response.headers.get("X-Record-Count") ?? 0);
  const exportId = response.headers.get("X-Export-Id") ?? "";

  return { blob, fileName, recordCount, exportId };
}

export async function fetchExportHistory(): Promise<{ items: ExportHistoryRecord[] }> {
  return apiGet<{ items: ExportHistoryRecord[] }>("/api/reports/history");
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
