/**
 * GET/POST /api/parameters
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { parseListQuery } from "@/server/dto/common.dto";
import { parameterService } from "@/server/services/parameter.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_VIEW");
    const data = await parameterService.list(parseListQuery(new URL(request.url).searchParams));
    return jsonSuccess(data, parameterService.getDataSource());
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_CREATE");
    const body = await request.json();
    const data = await parameterService.create(body);
    return jsonSuccess(data, parameterService.getDataSource(), 201);
  });
}
