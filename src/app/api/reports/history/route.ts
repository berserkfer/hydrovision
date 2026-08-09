/**
 * GET /api/reports/history
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { reportService } from "@/server/reports/report.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "EXPORT_DATA");
    const history = await reportService.history();
    return jsonSuccess({ items: history }, "mock");
  });
}
