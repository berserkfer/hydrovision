/**
 * ImportService — orquestación del flujo de importación — Sprint 3F
 */

import { detectColumnMapping } from "./column-detector";
import { parseCsvBuffer } from "./csv-parser";
import { parseExcelBuffer } from "./excel-parser";
import { assertImportFileAllowed } from "./file-security";
import { auditService } from "@/server/audit/audit.service";
import {
  executeImportTransaction,
  loadReferenceData,
  listImportHistory,
} from "./import.repository";
import type {
  ColumnMapping,
  ImportExecuteResult,
  ImportHistoryRecord,
  ImportValidationSummary,
  NormalizedImportRow,
  ParsedFileResult,
} from "./import.types";
import { validateImportRows } from "./import-validator";

export interface ImportPreviewResult extends ParsedFileResult {
  previewRows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
}

export class ImportService {
  parsePreview(
    buffer: Buffer,
    fileName: string,
    mimeType: string | null,
    size: number
  ): ImportPreviewResult {
    const kind = assertImportFileAllowed(fileName, mimeType, size);
    const parsed = kind === "csv" ? parseCsvBuffer(buffer) : parseExcelBuffer(buffer);

    return {
      ...parsed,
      previewRows: parsed.rows.slice(0, 10),
      suggestedMapping: detectColumnMapping(parsed.headers),
      fileName,
      fileSize: size,
      mimeType,
    };
  }

  async validate(
    rows: Record<string, string>[],
    mapping: ColumnMapping
  ): Promise<ImportValidationSummary> {
    const refs = await loadReferenceData();
    return validateImportRows(rows, mapping, refs);
  }

  async execute(
    validation: ImportValidationSummary,
    meta: {
      fileName: string;
      fileSize: number;
      mimeType: string | null;
      mapping: ColumnMapping;
    }
  ): Promise<ImportExecuteResult> {
    const importable = validation.rows.filter((r) => r.status !== "error");
    const normalizedRows: NormalizedImportRow[] = importable.map((r) => r.normalized);

    const result = await executeImportTransaction({
      fileName: meta.fileName,
      fileSize: meta.fileSize,
      mimeType: meta.mimeType,
      mapping: meta.mapping,
      rows: normalizedRows,
      validCount: validation.validCount,
      warningCount: validation.warningCount,
      errorCount: validation.errorCount,
      totalRows: validation.totalRows,
      rejectedCount: validation.errorCount,
    });

    await auditService.recordImport({
      importId: result.importId,
      fileName: meta.fileName,
      importedRows: result.importedRows,
      rejectedRows: result.rejectedRows,
      totalRows: validation.totalRows,
      status: result.status,
    });

    return result;
  }

  async history(): Promise<ImportHistoryRecord[]> {
    return listImportHistory();
  }
}

export const importService = new ImportService();
