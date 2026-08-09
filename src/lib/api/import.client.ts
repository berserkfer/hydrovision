/**
 * Cliente API — Importación de datos (Sprint 3F)
 */

import type { ColumnMapping, ImportValidationSummary } from "@/server/import/import.types";
import type { ImportPreviewResult } from "@/server/import/import.service";
import { apiGet, apiPost } from "./client";

export async function previewImportFile(file: File): Promise<ImportPreviewResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/import/preview", {
    method: "POST",
    body: form,
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? "Error al procesar el archivo");
  }
  return body.data as ImportPreviewResult;
}

export async function validateImportData(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Promise<ImportValidationSummary> {
  return apiPost<ImportValidationSummary>("/api/import/validate", { rows, mapping });
}

export async function executeImport(payload: {
  validation: ImportValidationSummary;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  mapping: ColumnMapping;
}) {
  return apiPost("/api/import/execute", payload);
}

export async function fetchImportHistory() {
  return apiGet<{ items: import("@/server/import/import.types").ImportHistoryRecord[] }>(
    "/api/import/history"
  );
}
