/**
 * Contexto de usuario de una petición — tipo común + usuario SIMULADO de desarrollo.
 *
 * El usuario simulado (header `x-hydrovision-dev-user` o `DEV_SIMULATED_USER_ID`) NO es
 * autenticación: solo funciona con NODE_ENV=development. En cualquier otro entorno
 * (production, test…) queda bloqueado y la petición necesita una sesión real
 * (ver request-user.ts y src/server/auth/).
 */

import { getDataStore } from "@/data/store-access";
import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { prisma } from "@/server/db";
import { RolUsuario } from "@/constants/enums";
import { toAppRole, type AppRole } from "./roles";

export interface AuthUserContext {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: "active" | "inactive";
  /** true solo para el usuario simulado de desarrollo. */
  isSimulated: boolean;
  /** session: inicio de sesión real · dev-simulated: usuario simulado de desarrollo. */
  authMode: "session" | "dev-simulated";
}

const DEFAULT_DEV_USER_ID = "usr-admin";
export const DEV_USER_HEADER = "x-hydrovision-dev-user";

/** El usuario simulado solo existe con NODE_ENV=development. */
export function isSimulatedAuthBlocked(): boolean {
  return process.env.NODE_ENV !== "development";
}

function mapStatus(activo: boolean, estado?: string): "active" | "inactive" {
  if (!activo) return "inactive";
  if (estado && estado !== "active") return "inactive";
  return "active";
}

function fromMock(userId: string): AuthUserContext | null {
  const user = getDataStore().usuarios.find((u) => u.id === userId);
  if (!user) return null;
  return {
    id: user.id,
    name: user.nombre,
    email: user.email,
    role: toAppRole(user.rol),
    status: mapStatus(user.activo),
    isSimulated: true,
    authMode: "dev-simulated",
  };
}

async function fromDatabase(userId: string): Promise<AuthUserContext | null> {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: toAppRole(user.rol as RolUsuario),
      status: mapStatus(user.activo, user.estado),
      isSimulated: true,
      authMode: "dev-simulated",
    };
  } catch {
    return null;
  }
}

/** Id del usuario simulado en desarrollo; null fuera de desarrollo (simulación bloqueada). */
export function resolveDevUserId(request?: Request): string | null {
  if (isSimulatedAuthBlocked()) return null;
  const header = request?.headers.get(DEV_USER_HEADER);
  if (header?.trim()) return header.trim();
  return process.env.DEV_SIMULATED_USER_ID?.trim() || DEFAULT_DEV_USER_ID;
}

/** Usuario simulado de desarrollo; null fuera de desarrollo. */
export async function getSimulatedUserContext(request?: Request): Promise<AuthUserContext | null> {
  const userId = resolveDevUserId(request);
  if (userId === null) return null;

  const fromDb = isMonitoringDatabaseEnabled() ? await fromDatabase(userId) : null;
  const user = fromDb ?? fromMock(userId) ?? fromMock(DEFAULT_DEV_USER_ID);
  if (!user) {
    return {
      id: DEFAULT_DEV_USER_ID,
      name: "Admin Simulado",
      email: "dev.admin@hydrovision.local",
      role: "ADMIN",
      status: "active",
      isSimulated: true,
      authMode: "dev-simulated",
    };
  }
  return user;
}
