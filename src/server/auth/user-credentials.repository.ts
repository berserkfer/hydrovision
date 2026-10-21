/**
 * Acceso a usuarios para autenticación (PostgreSQL vía Prisma).
 *
 * Las contraseñas solo existen en la base de datos: sin DATABASE_URL no hay inicio de sesión
 * real (el login responde 503 y lo dice), y solo queda el usuario simulado en desarrollo.
 */

import { prisma } from "@/server/db";
import { RolUsuario } from "@/constants/enums";
import { toAppRole, type AppRole } from "@/server/authorization/roles";

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  active: boolean;
  passwordHash: string | null;
}

export function isAuthDatabaseAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  estado: string;
  passwordHash: string | null;
};

function toRecord(row: UsuarioRow): AuthUserRecord {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    role: toAppRole(row.rol as RolUsuario),
    active: row.activo && row.estado === "active",
    passwordHash: row.passwordHash,
  };
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  if (!isAuthDatabaseAvailable()) return null;
  const row = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  return row ? toRecord(row) : null;
}

export async function findAuthUserById(id: string): Promise<AuthUserRecord | null> {
  if (!isAuthDatabaseAvailable()) return null;
  const row = await prisma.usuario.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}
