/**
 * Parser CSV — Sprint 3F
 */

import Papa from "papaparse";
import { ApiError } from "@/server/api/errors";
import type { ParsedFileResult } from "./import.types";

export function parseCsvBuffer(buffer: Buffer): ParsedFileResult {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  if (!text.trim()) {
    throw ApiError.validation("El archivo CSV no contiene datos");
  }

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw ApiError.validation(`Error al leer CSV: ${first.message}`);
  }

  const headers = parsed.meta.fields?.filter(Boolean) ?? [];
  if (headers.length === 0) {
    throw ApiError.validation("No se detectaron encabezados en el archivo CSV");
  }

  const rows = (parsed.data ?? []).map((row) => {
    const normalized: Record<string, string> = {};
    for (const header of headers) {
      normalized[header] = String(row[header] ?? "").trim();
    }
    return normalized;
  });

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
}
