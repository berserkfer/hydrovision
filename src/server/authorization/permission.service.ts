/**
 * PermissionService — consulta de permisos — Sprint 3I
 */

import {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS,
  ROLE_PERMISSION_MATRIX,
  type PermissionCode,
} from "./permissions";
import type { AppRole } from "./roles";

export class PermissionService {
  listAll(): PermissionCode[] {
    return [...PERMISSIONS];
  }

  getLabel(code: PermissionCode): string {
    return PERMISSION_LABELS[code];
  }

  getCategory(code: PermissionCode): string {
    return PERMISSION_CATEGORIES[code];
  }

  forRole(role: AppRole): PermissionCode[] {
    return [...ROLE_PERMISSION_MATRIX[role]];
  }

  matrix(): Array<{
    code: PermissionCode;
    label: string;
    category: string;
    roles: AppRole[];
  }> {
    return PERMISSIONS.map((code) => ({
      code,
      label: PERMISSION_LABELS[code],
      category: PERMISSION_CATEGORIES[code],
      roles: (Object.keys(ROLE_PERMISSION_MATRIX) as AppRole[]).filter((role) =>
        ROLE_PERMISSION_MATRIX[role].includes(code)
      ),
    }));
  }
}

export const permissionService = new PermissionService();
