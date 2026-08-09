/**
 * GET /api/audit/[id] — detalle de registro de auditoría (solo lectura)
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { auditService } from "@/server/audit/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return runRouteHandler(async () => {
    await requirePermission(request, "VIEW_AUDIT");
    const { id } = await context.params;
    const detail = await auditService.getById(id);
    if (!detail) throw ApiError.notFound("Registro de auditoría", id);
    return jsonSuccess(detail, "mock");
  });
}
