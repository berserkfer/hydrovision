/**
 * RoleService — roles y permisos asociados — Sprint 3I
 */

import { permissionService } from "./permission.service";
import {
  APP_ROLE_DESCRIPTIONS,
  APP_ROLE_LABELS,
  APP_ROLES,
  type AppRole,
} from "./roles";
import type { PermissionCode } from "./permissions";

export interface RoleDefinition {
  code: AppRole;
  name: string;
  description: string;
  permissions: PermissionCode[];
}

export class RoleService {
  listRoles(): RoleDefinition[] {
    return APP_ROLES.map((code) => ({
      code,
      name: APP_ROLE_LABELS[code],
      description: APP_ROLE_DESCRIPTIONS[code],
      permissions: permissionService.forRole(code),
    }));
  }

  getRole(code: AppRole): RoleDefinition | null {
    return this.listRoles().find((r) => r.code === code) ?? null;
  }

  permissionsFor(code: AppRole): PermissionCode[] {
    return permissionService.forRole(code);
  }
}

export const roleService = new RoleService();
