/**
 * AuthorizationService — autorización basada en roles — Sprint 3I
 */

import { ApiError } from "@/server/api/errors";
import { ROLE_PERMISSION_MATRIX, type PermissionCode } from "./permissions";
import { type AppRole } from "./roles";
import type { AuthUserContext } from "./dev-user-context";
import { resolveRequestUser, type RequestUserDeps } from "./request-user";

export class AuthorizationService {
  hasRole(user: AuthUserContext, role: AppRole): boolean {
    return user.role === role;
  }

  hasPermission(user: AuthUserContext, permission: PermissionCode): boolean {
    if (user.status !== "active") return false;
    if (user.role === "ADMIN") return true;
    return ROLE_PERMISSION_MATRIX[user.role].includes(permission);
  }

  can(user: AuthUserContext, permission: PermissionCode): boolean {
    return this.hasPermission(user, permission);
  }

  assertActive(user: AuthUserContext): void {
    if (user.status !== "active") {
      throw ApiError.forbidden("Usuario inactivo — operación no permitida");
    }
  }

  assertPermission(user: AuthUserContext, permission: PermissionCode): void {
    this.assertActive(user);
    if (!this.hasPermission(user, permission)) {
      throw ApiError.forbidden(`Permiso requerido: ${permission}`);
    }
  }

  /** Sin usuario → 401; usuario sin el permiso (o inactivo) → 403. */
  async authorize(
    request: Request,
    permission: PermissionCode,
    deps?: RequestUserDeps
  ): Promise<AuthUserContext> {
    const user = await resolveRequestUser(request, deps);
    if (!user) throw ApiError.unauthorized();
    this.assertPermission(user, permission);
    return user;
  }

  /** Exige solo una sesión (o usuario simulado en desarrollo), sin permiso concreto. */
  async authenticate(request: Request, deps?: RequestUserDeps): Promise<AuthUserContext> {
    const user = await resolveRequestUser(request, deps);
    if (!user) throw ApiError.unauthorized();
    this.assertActive(user);
    return user;
  }
}

export const authorizationService = new AuthorizationService();
