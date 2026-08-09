/**
 * GET /api/import/history
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { importService } from "@/server/import/import.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    const history = await importService.history();
    return jsonSuccess({ items: history }, "database");
  });
}
