/**
 * POST /api/reports/export
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { reportService } from "@/server/reports/report.service";
import type { ExportFormat, ExportReportFilters, ExportSections } from "@/server/reports/report.types";
import { DEFAULT_EXPORT_FILTERS, DEFAULT_EXPORT_SECTIONS } from "@/server/reports/report.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "EXPORT_DATA");
    const body = (await request.json()) as {
      filters?: Partial<ExportReportFilters>;
      format?: ExportFormat;
      sections?: Partial<ExportSections>;
    };

    const format = body.format ?? "csv";
    if (!["csv", "xlsx", "pdf"].includes(format)) {
      throw ApiError.validation("Formato de exportación no válido");
    }

    const filters: ExportReportFilters = { ...DEFAULT_EXPORT_FILTERS, ...body.filters };
    const sections: ExportSections = { ...DEFAULT_EXPORT_SECTIONS, ...body.sections };

    const result = await reportService.export(filters, format, sections);

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Record-Count": String(result.recordCount),
        "X-Export-Id": result.historyId,
      },
    });
  });
}
