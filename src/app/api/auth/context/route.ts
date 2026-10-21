/**
 * GET /api/auth/context — usuario de la sesión (o simulado en desarrollo); 401 sin sesión.
 * GET /api/auth/context?mode=roles — roles y matriz de permisos (requiere sesión).
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { isSimulatedAuthBlocked } from "@/server/authorization/dev-user-context";
import { permissionService } from "@/server/authorization/permission.service";
import { roleService } from "@/server/authorization/role.service";
import { authorizationService } from "@/server/authorization/authorization.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    const user = await authorizationService.authenticate(request);
    const { searchParams } = new URL(request.url);

    if (searchParams.get("mode") === "roles") {
      return jsonSuccess(
        {
          roles: roleService.listRoles(),
          matrix: permissionService.matrix(),
        },
        "mock"
      );
    }

    const devMode = !isSimulatedAuthBlocked();
    return jsonSuccess(
      {
        user,
        permissions: roleService.permissionsFor(user.role),
        canManageUsers: authorizationService.can(user, "MANAGE_USERS"),
        devMode,
        hint:
          user.authMode === "dev-simulated"
            ? "Desarrollo: usuario simulado (header X-HydroVision-Dev-User o DEV_SIMULATED_USER_ID). No funciona fuera de NODE_ENV=development."
            : "Sesión iniciada con correo y contraseña.",
      },
      "mock"
    );
  });
}
