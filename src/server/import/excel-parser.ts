/**
 * Parser Excel — Sprint 3F
 */

import * as XLSX from "xlsx";
import { ApiError } from "@/server/api/errors";
import type { ParsedFileResult } from "./import.types";

export function parseExcelBuffer(buffer: Buffer): ParsedFileResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    throw ApiError.validation("No se pudo leer el archivo Excel");
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw ApiError.validation("El archivo Excel no contiene hojas");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    throw ApiError.validation("El archivo Excel está vacío");
  }

  const headerRow = matrix[0].map((cell) => String(cell ?? "").trim()).filter(Boolean);
  if (headerRow.length === 0) {
    throw ApiError.validation("No se detectaron encabezados en el archivo Excel");
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i];
    const row: Record<string, string> = {};
    let hasValue = false;
    headerRow.forEach((header, idx) => {
      const value = String(line[idx] ?? "").trim();
      row[header] = value;
      if (value) hasValue = true;
    });
    if (hasValue) rows.push(row);
  }

  return {
    headers: headerRow,
    rows,
    rowCount: rows.length,
    columnCount: headerRow.length,
  };
}
