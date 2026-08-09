/**
 * GET /api/audit — listado de auditoría (solo lectura)
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { auditService } from "@/server/audit/audit.service";
import type { AuditFilters } from "@/server/audit/audit.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "VIEW_AUDIT");
    const { searchParams } = new URL(request.url);
    const filters: AuditFilters = {
      entityType: searchParams.get("entityType") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      responsableId: searchParams.get("responsableId") ?? undefined,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const [items, summary] = await Promise.all([
      auditService.list(filters),
      auditService.summary(filters),
    ]);

    return jsonSuccess({ items, summary }, "mock");
  });
}
