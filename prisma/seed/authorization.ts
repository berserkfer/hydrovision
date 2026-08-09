/**
 * Seed roles, permisos y usuarios ficticios — Sprint 3I
 */

import type { PrismaClient } from "@prisma/client";

const APP_ROLES = ["ADMIN", "INVESTIGATOR", "TECHNICIAN", "VIEWER"] as const;

const APP_ROLE_LABELS: Record<(typeof APP_ROLES)[number], string> = {
  ADMIN: "Administrador",
  INVESTIGATOR: "Investigador",
  TECHNICIAN: "Técnico de campo",
  VIEWER: "Visor",
};

const APP_ROLE_DESCRIPTIONS: Record<(typeof APP_ROLES)[number], string> = {
  ADMIN: "Acceso completo al sistema y gestión de usuarios",
  INVESTIGATOR: "Análisis científico, importación y exportación de datos",
  TECHNICIAN: "Registro y actualización de mediciones de campo",
  VIEWER: "Consulta de información ambiental",
};

const PERMISSIONS = [
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

const PERMISSION_LABELS: Record<(typeof PERMISSIONS)[number], string> = {
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

const PERMISSION_CATEGORIES: Record<(typeof PERMISSIONS)[number], string> = {
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

const ROLE_PERMISSION_MATRIX: Record<(typeof APP_ROLES)[number], readonly (typeof PERMISSIONS)[number][]> = {
  ADMIN: PERMISSIONS,
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

const DEV_USERS = [
  {
    id: "usr-admin",
    nombre: "Admin Demo",
    email: "admin.demo@hydrovision.local",
    rol: "admin" as const,
    institucion: "HydroVision — cuenta ficticia",
    activo: true,
  },
  {
    id: "usr-investigador",
    nombre: "Investigador Demo",
    email: "investigador.demo@hydrovision.local",
    rol: "researcher" as const,
    institucion: "HydroVision — cuenta ficticia",
    activo: true,
  },
  {
    id: "usr-operador",
    nombre: "Técnico Demo",
    email: "tecnico.demo@hydrovision.local",
    rol: "field_operator" as const,
    institucion: "HydroVision — cuenta ficticia",
    activo: true,
  },
  {
    id: "usr-visor",
    nombre: "Visor Demo",
    email: "visor.demo@hydrovision.local",
    rol: "viewer" as const,
    institucion: "HydroVision — cuenta ficticia",
    activo: true,
  },
  {
    id: "usr-inactivo",
    nombre: "Usuario Inactivo",
    email: "inactivo.demo@hydrovision.local",
    rol: "viewer" as const,
    institucion: "Cuenta deshabilitada — prueba",
    activo: false,
  },
];

export async function seedAuthorization(prisma: PrismaClient): Promise<void> {
  for (const roleCode of APP_ROLES) {
    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name: APP_ROLE_LABELS[roleCode],
        description: APP_ROLE_DESCRIPTIONS[roleCode],
      },
      create: {
        id: `role-${roleCode.toLowerCase()}`,
        code: roleCode,
        name: APP_ROLE_LABELS[roleCode],
        description: APP_ROLE_DESCRIPTIONS[roleCode],
      },
    });
  }

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {
        name: PERMISSION_LABELS[code],
        category: PERMISSION_CATEGORIES[code],
      },
      create: {
        id: `perm-${code.toLowerCase().replace(/_/g, "-")}`,
        code,
        name: PERMISSION_LABELS[code],
        category: PERMISSION_CATEGORIES[code],
      },
    });
  }

  for (const roleCode of APP_ROLES) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    for (const permCode of ROLE_PERMISSION_MATRIX[roleCode]) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  for (const user of DEV_USERS) {
    await prisma.usuario.upsert({
      where: { id: user.id },
      update: {
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        institucion: user.institucion,
        activo: user.activo,
        estado: user.activo ? "active" : "inactive",
      },
      create: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        institucion: user.institucion,
        activo: user.activo,
        estado: user.activo ? "active" : "inactive",
        observaciones: "Usuario ficticio — Sprint 3I",
      },
    });
  }
}
