/**
 * ReportRepository — historial de exportaciones — Sprint 3G
 */

import { isDatabaseConfigured } from "@/config/database.config";
import { prisma } from "@/server/db";
import type {
  ExportFormat,
  ExportHistoryRecord,
  ExportReportFilters,
  ExportSections,
} from "./report.types";

const mockHistory: ExportHistoryRecord[] = [];

export async function resolveDefaultResponsable(): Promise<{ id: string; nombre: string }> {
  if (isDatabaseConfigured()) {
    try {
      const user = await prisma.usuario.findFirst({
        where: { activo: true, estado: "active" },
        orderBy: { createdAt: "asc" },
      });
      if (user) return { id: user.id, nombre: user.nombre };
    } catch {
      // mock fallback
    }
  }
  return { id: "usr-investigador", nombre: "Investigador HydroVision" };
}

export async function saveExportHistory(input: {
  id: string;
  fileFormat: ExportFormat;
  fileName: string;
  responsableId: string;
  responsableNombre: string;
  filters: ExportReportFilters;
  sections: ExportSections;
  recordCount: number;
}): Promise<ExportHistoryRecord> {
  const record: ExportHistoryRecord = {
    id: input.id,
    fileFormat: input.fileFormat,
    fileName: input.fileName,
    responsableId: input.responsableId,
    responsableNombre: input.responsableNombre,
    filters: input.filters,
    sections: input.sections,
    recordCount: input.recordCount,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseConfigured()) {
    try {
      await prisma.reportExport.create({
        data: {
          id: input.id,
          fileFormat: input.fileFormat,
          fileName: input.fileName,
          responsableId: input.responsableId,
          responsableNombre: input.responsableNombre,
          filters: input.filters as object,
          sections: input.sections as object,
          recordCount: input.recordCount,
        },
      });
      return record;
    } catch {
      // fall through
    }
  }

  mockHistory.unshift(record);
  if (mockHistory.length > 50) mockHistory.pop();
  return record;
}

export async function listExportHistory(limit = 30): Promise<ExportHistoryRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.reportExport.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map((r) => ({
        id: r.id,
        fileFormat: r.fileFormat as ExportFormat,
        fileName: r.fileName,
        responsableId: r.responsableId,
        responsableNombre: r.responsableNombre ?? "—",
        filters: r.filters as unknown as ExportReportFilters,
        sections: (r.sections as unknown as ExportSections | null) ?? null,
        recordCount: r.recordCount,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      // fall through
    }
  }

  return mockHistory.slice(0, limit);
}
