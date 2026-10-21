/**
 * Guards de autorización para APIs — Sprint 3I
 */

import type { NextResponse } from "next/server";
import { isApiError } from "@/server/api/errors";
import { jsonError } from "@/server/api/response";
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

/**
 * Para rutas que no usan runRouteHandler: devuelve la respuesta 401/403 lista para retornar,
 * o null si la petición está autorizada.
 */
export async function guardPermission(
  request: Request,
  permission: PermissionCode
): Promise<NextResponse | null> {
  try {
    await requirePermission(request, permission);
    return null;
  } catch (error) {
    if (isApiError(error)) return jsonError(error);
    throw error;
  }
}
