/**
 * ReportService — orquestación de exportación — Sprint 3G
 */

import { auditService } from "@/server/audit/audit.service";
import { buildExportBundle, buildExportPreview, getExportFilterOptions } from "./report-data.builder";
import { csvExportService } from "./csv-export.service";
import { excelExportService } from "./excel-export.service";
import { pdfExportService } from "./pdf-export.service";
import { listExportHistory, resolveDefaultResponsable, saveExportHistory } from "./report.repository";
import type {
  ExportFormat,
  ExportPreviewDto,
  ExportReportFilters,
  ExportResult,
  ExportSections,
  ExportFilterOptions,
  ExportHistoryRecord,
} from "./report.types";
import { DEFAULT_EXPORT_SECTIONS } from "./report.types";

const MIME: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const EXT: Record<ExportFormat, string> = {
  csv: "csv",
  xlsx: "xlsx",
  pdf: "pdf",
};

export class ReportService {
  filterOptions(): ExportFilterOptions {
    return getExportFilterOptions();
  }

  async preview(filters: ExportReportFilters): Promise<ExportPreviewDto> {
    return buildExportPreview(filters);
  }

  async export(
    filters: ExportReportFilters,
    format: ExportFormat,
    sections: ExportSections = DEFAULT_EXPORT_SECTIONS
  ): Promise<ExportResult> {
    const responsable = await resolveDefaultResponsable();
    const bundle = buildExportBundle(filters, sections, responsable.nombre);

    let buffer: Buffer;
    switch (format) {
      case "csv":
        buffer = csvExportService.generate(bundle);
        break;
      case "xlsx":
        buffer = excelExportService.generate(bundle);
        break;
      case "pdf":
        buffer = pdfExportService.generate(bundle);
        break;
      default:
        buffer = csvExportService.generate(bundle);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `hydrovision-export-${stamp}.${EXT[format]}`;
    const historyId = `exp-${Date.now()}`;

    await saveExportHistory({
      id: historyId,
      fileFormat: format,
      fileName,
      responsableId: responsable.id,
      responsableNombre: responsable.nombre,
      filters,
      sections,
      recordCount: bundle.preview.statistics.totalRegistros,
    });

    await auditService.recordExport({
      exportId: historyId,
      fileFormat: format,
      fileName,
      recordCount: bundle.preview.statistics.totalRegistros,
      filters,
      responsableId: responsable.id,
      responsableNombre: responsable.nombre,
    });

    return {
      buffer,
      fileName,
      mimeType: MIME[format],
      recordCount: bundle.preview.statistics.totalRegistros,
      historyId,
    };
  }

  async history(): Promise<ExportHistoryRecord[]> {
    return listExportHistory();
  }
}

export const reportService = new ReportService();
