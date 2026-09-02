/**
 * GET/PUT/DELETE /api/measurements/:id
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { measurementService } from "@/server/services/measurement.service";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_VIEW");
    const { id } = await context.params;
    const data = await measurementService.getById(id);
    return jsonSuccess(data, measurementService.getDataSource());
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_UPDATE");
    const { id } = await context.params;
    const body = await request.json();
    const data = await measurementService.update(id, body);
    return jsonSuccess(data, measurementService.getDataSource());
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_DELETE");
    const { id } = await context.params;
    const data = await measurementService.remove(id);
    return jsonSuccess(data, measurementService.getDataSource());
  });
}
