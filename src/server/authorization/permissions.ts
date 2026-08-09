/**
 * Permisos del sistema — Sprint 3I
 */

import type { AppRole } from "./roles";

export const PERMISSIONS = [
  "STATIONS_VIEW",
  "STATIONS_CREATE",
  "STATIONS_UPDATE",
  "STATIONS_DELETE",
  "CAMPAIGNS_VIEW",
  "CAMPAIGNS_CREATE",
  "CAMPAIGNS_UPDATE",
  "CAMPAIGNS_DELETE",
  "MEASUREMENTS_VIEW",
  "MEASUREMENTS_CREATE",
  "MEASUREMENTS_UPDATE",
  "MEASUREMENTS_DELETE",
  "IMPORT_DATA",
  "EXPORT_DATA",
  "VIEW_AUDIT",
  "MANAGE_USERS",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  STATIONS_VIEW: "Ver estaciones",
  STATIONS_CREATE: "Crear estaciones",
  STATIONS_UPDATE: "Editar estaciones",
  STATIONS_DELETE: "Eliminar estaciones",
  CAMPAIGNS_VIEW: "Ver campañas",
  CAMPAIGNS_CREATE: "Crear campañas",
  CAMPAIGNS_UPDATE: "Editar campañas",
  CAMPAIGNS_DELETE: "Eliminar campañas",
  MEASUREMENTS_VIEW: "Ver mediciones",
  MEASUREMENTS_CREATE: "Registrar mediciones",
  MEASUREMENTS_UPDATE: "Actualizar mediciones",
  MEASUREMENTS_DELETE: "Eliminar mediciones",
  IMPORT_DATA: "Importar datos",
  EXPORT_DATA: "Exportar datos",
  VIEW_AUDIT: "Ver auditoría",
  MANAGE_USERS: "Gestionar usuarios",
};

export const PERMISSION_CATEGORIES: Record<PermissionCode, string> = {
  STATIONS_VIEW: "Estaciones",
  STATIONS_CREATE: "Estaciones",
  STATIONS_UPDATE: "Estaciones",
  STATIONS_DELETE: "Estaciones",
  CAMPAIGNS_VIEW: "Campañas",
  CAMPAIGNS_CREATE: "Campañas",
  CAMPAIGNS_UPDATE: "Campañas",
  CAMPAIGNS_DELETE: "Campañas",
  MEASUREMENTS_VIEW: "Mediciones",
  MEASUREMENTS_CREATE: "Mediciones",
  MEASUREMENTS_UPDATE: "Mediciones",
  MEASUREMENTS_DELETE: "Mediciones",
  IMPORT_DATA: "Datos",
  EXPORT_DATA: "Datos",
  VIEW_AUDIT: "Administración",
  MANAGE_USERS: "Administración",
};

/** Matriz Role → Permissions (fuente de verdad en código; replicada en seed DB) */
export const ROLE_PERMISSION_MATRIX: Record<AppRole, readonly PermissionCode[]> = {
  ADMIN: [...PERMISSIONS],
  INVESTIGATOR: [
    "STATIONS_VIEW",
    "STATIONS_CREATE",
    "STATIONS_UPDATE",
    "CAMPAIGNS_VIEW",
    "CAMPAIGNS_CREATE",
    "CAMPAIGNS_UPDATE",
    "MEASUREMENTS_VIEW",
    "MEASUREMENTS_CREATE",
    "MEASUREMENTS_UPDATE",
    "MEASUREMENTS_DELETE",
    "IMPORT_DATA",
    "EXPORT_DATA",
    "VIEW_AUDIT",
  ],
  TECHNICIAN: [
    "STATIONS_VIEW",
    "CAMPAIGNS_VIEW",
    "MEASUREMENTS_VIEW",
    "MEASUREMENTS_CREATE",
    "MEASUREMENTS_UPDATE",
  ],
  VIEWER: ["STATIONS_VIEW", "CAMPAIGNS_VIEW", "MEASUREMENTS_VIEW"],
};
