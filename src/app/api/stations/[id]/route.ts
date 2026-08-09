/**
 * GET /api/stations/:id — detalle de estación
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { stationService } from "@/server/services/station.service";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    const { id } = await context.params;
    const data = await stationService.getById(id);
    return jsonSuccess(data, stationService.getDataSource());
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_UPDATE");
    const { id } = await context.params;
    const body = await request.json();
    const data = await stationService.update(id, body);
    return jsonSuccess(data, stationService.getDataSource());
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_DELETE");
    const { id } = await context.params;
    const data = await stationService.remove(id);
    return jsonSuccess(data, stationService.getDataSource());
  });
}
