/**
 * GET /api/users — listado
 * POST /api/users — crear (MANAGE_USERS)
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { userService } from "@/server/services/user.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MANAGE_USERS");
    const data = userService.list();
    return jsonSuccess(data, "mock");
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "MANAGE_USERS");
    const body = await request.json();
    const data = await userService.create(body);
    return jsonSuccess(data, "mock", 201);
  });
}
