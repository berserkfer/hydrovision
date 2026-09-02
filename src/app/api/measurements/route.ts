/**
 * GET/POST /api/measurements
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { parseListQuery } from "@/server/dto/common.dto";
import { measurementService } from "@/server/services/measurement.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_VIEW");
    const params = new URL(request.url).searchParams;
    const query = {
      ...parseListQuery(params),
      muestreoId: params.get("muestreoId") ?? undefined,
      parametroCodigo: params.get("parametroCodigo") ?? undefined,
    };
    const data = await measurementService.list(query);
    return jsonSuccess(data, measurementService.getDataSource());
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_CREATE");
    const body = await request.json();
    const data = await measurementService.create(body);
    return jsonSuccess(data, measurementService.getDataSource(), 201);
  });
}
