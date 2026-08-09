/**
 * GET /api/stations — listado, estadísticas y opciones de filtro
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { parseListQuery } from "@/server/dto/common.dto";
import { requirePermission } from "@/server/authorization/guards";
import { stationService } from "@/server/services/station.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    const query = parseListQuery(new URL(request.url).searchParams);
    const data = await stationService.getList(query);
    return jsonSuccess(data, stationService.getDataSource());
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_CREATE");
    const body = await request.json();
    const data = await stationService.create(body);
    return jsonSuccess(data, stationService.getDataSource(), 201);
  });
}
