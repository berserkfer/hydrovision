/**
 * GET/POST /api/samples
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { parseListQuery } from "@/server/dto/common.dto";
import { sampleService } from "@/server/services/sample.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_VIEW");
    const params = new URL(request.url).searchParams;
    const query = {
      ...parseListQuery(params),
      campanaId: params.get("campanaId") ?? undefined,
    };
    const data = sampleService.list(query);
    return jsonSuccess(data, "mock");
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_CREATE");
    const body = await request.json();
    const data = sampleService.create(body);
    return jsonSuccess(data, "mock", 201);
  });
}
