/**
 * GET/PUT/DELETE /api/samples/:id
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { sampleService } from "@/server/services/sample.service";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_VIEW");
    const { id } = await context.params;
    return jsonSuccess(sampleService.getById(id), "mock");
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_UPDATE");
    const { id } = await context.params;
    const body = await request.json();
    return jsonSuccess(sampleService.update(id, body), "mock");
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MEASUREMENTS_DELETE");
    const { id } = await context.params;
    return jsonSuccess(sampleService.remove(id), "mock");
  });
}
