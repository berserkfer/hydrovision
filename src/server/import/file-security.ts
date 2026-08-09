/**
 * Validaciones de seguridad para archivos de importación — Sprint 3F
 */

import { ApiError } from "@/server/api/errors";

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);

const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

export function assertImportFileAllowed(
  fileName: string,
  mimeType: string | null,
  size: number
): "csv" | "excel" {
  if (size <= 0) {
    throw ApiError.validation("El archivo está vacío");
  }
  if (size > MAX_IMPORT_FILE_BYTES) {
    throw ApiError.validation(
      `El archivo excede el tamaño máximo permitido (${Math.round(MAX_IMPORT_FILE_BYTES / 1024 / 1024)} MB)`
    );
  }

  const ext = getFileExtension(fileName);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw ApiError.validation("Formato no permitido. Use .csv, .xlsx o .xls");
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw ApiError.validation("Tipo MIME no permitido para importación");
  }

  return ext === ".csv" ? "csv" : "excel";
}
