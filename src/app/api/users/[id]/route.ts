/**
 * GET/PUT/DELETE /api/users/[id]
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { userService } from "@/server/services/user.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MANAGE_USERS");
    const { id } = await context.params;
    const data = await userService.getById(id);
    return jsonSuccess(data, "mock");
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MANAGE_USERS");
    const { id } = await context.params;
    const body = await request.json();
    const data = await userService.update(id, body);
    return jsonSuccess(data, "mock");
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MANAGE_USERS");
    const { id } = await context.params;
    const data = await userService.remove(id);
    return jsonSuccess(data, "mock");
  });
}
