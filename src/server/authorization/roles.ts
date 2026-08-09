/**
 * Roles de aplicación — Sprint 3I
 */

import { RolUsuario } from "@/constants/enums";

export const APP_ROLES = ["ADMIN", "INVESTIGATOR", "TECHNICIAN", "VIEWER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrador",
  INVESTIGATOR: "Investigador",
  TECHNICIAN: "Técnico de campo",
  VIEWER: "Visor",
};

export const APP_ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  ADMIN: "Acceso completo al sistema y gestión de usuarios",
  INVESTIGATOR: "Análisis científico, importación y exportación de datos",
  TECHNICIAN: "Registro y actualización de mediciones de campo",
  VIEWER: "Consulta de información ambiental",
};

/** Mapeo RolUsuario (dominio/mock) ↔ AppRole (autorización) */
export const ROL_USUARIO_TO_APP_ROLE: Record<RolUsuario, AppRole> = {
  [RolUsuario.ADMINISTRADOR]: "ADMIN",
  [RolUsuario.INVESTIGADOR]: "INVESTIGATOR",
  [RolUsuario.OPERADOR_CAMPO]: "TECHNICIAN",
  [RolUsuario.VISOR]: "VIEWER",
};

export const APP_ROLE_TO_ROL_USUARIO: Record<AppRole, RolUsuario> = {
  ADMIN: RolUsuario.ADMINISTRADOR,
  INVESTIGATOR: RolUsuario.INVESTIGADOR,
  TECHNICIAN: RolUsuario.OPERADOR_CAMPO,
  VIEWER: RolUsuario.VISOR,
};

export function toAppRole(rol: RolUsuario | string): AppRole {
  const mapped = ROL_USUARIO_TO_APP_ROLE[rol as RolUsuario];
  if (mapped) return mapped;
  if (APP_ROLES.includes(rol as AppRole)) return rol as AppRole;
  return "VIEWER";
}

export function toRolUsuario(role: AppRole): RolUsuario {
  return APP_ROLE_TO_ROL_USUARIO[role];
}
