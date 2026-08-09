/**
 * POST /api/reports/preview
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { reportService } from "@/server/reports/report.service";
import type { ExportReportFilters } from "@/server/reports/report.types";
import { DEFAULT_EXPORT_FILTERS } from "@/server/reports/report.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "EXPORT_DATA");
    const body = (await request.json()) as Partial<ExportReportFilters>;
    const filters: ExportReportFilters = { ...DEFAULT_EXPORT_FILTERS, ...body };
    const preview = await reportService.preview(filters);
    return jsonSuccess(preview, "mock");
  });
}
