/**
 * Guards de autorización para APIs — Sprint 3I
 */

import type { PermissionCode } from "./permissions";
import { authorizationService } from "./authorization.service";
import type { AuthUserContext } from "./dev-user-context";

export async function requirePermission(
  request: Request,
  permission: PermissionCode
): Promise<AuthUserContext> {
  return authorizationService.authorize(request, permission);
}

export async function withPermission<T>(
  request: Request,
  permission: PermissionCode,
  handler: (user: AuthUserContext) => Promise<T>
): Promise<T> {
  const user = await requirePermission(request, permission);
  return handler(user);
}
