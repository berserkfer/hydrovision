/**
 * GET /api/auth/context — usuario simulado de desarrollo
 * GET /api/auth/roles — roles y matriz de permisos
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { getSimulatedUserContext } from "@/server/authorization/dev-user-context";
import { permissionService } from "@/server/authorization/permission.service";
import { roleService } from "@/server/authorization/role.service";
import { authorizationService } from "@/server/authorization/authorization.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "roles") {
      return jsonSuccess(
        {
          roles: roleService.listRoles(),
          matrix: permissionService.matrix(),
        },
        "mock"
      );
    }

    const user = await getSimulatedUserContext(request);
    const permissions = roleService.permissionsFor(user.role);

    return jsonSuccess(
      {
        user,
        permissions,
        canManageUsers: authorizationService.can(user, "MANAGE_USERS"),
        devMode: true,
        hint: "Use header X-HydroVision-Dev-User o DEV_SIMULATED_USER_ID para simular otro usuario",
      },
      "mock"
    );
  });
}
