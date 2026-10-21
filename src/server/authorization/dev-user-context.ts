/**
 * Contexto de usuario simulado para desarrollo — Sprint 3I
 * NO es autenticación real. Separado explícitamente para reemplazo futuro.
 *
 * En producción (NODE_ENV=production) la simulación queda bloqueada:
 * - el header `x-hydrovision-dev-user` y `DEV_SIMULATED_USER_ID` no tienen efecto;
 * - nunca se asigna ADMIN por defecto: se devuelve un visitante anónimo de solo
 *   lectura (rol VIEWER). Cualquier escritura responde 403 hasta que exista
 *   autenticación real.
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
  isSimulated: true;
  /** dev-simulated: usuario elegido en desarrollo · production-anonymous: visitante sin autenticar. */
  authMode: "dev-simulated" | "production-anonymous";
}

const DEFAULT_DEV_USER_ID = "usr-admin";
export const DEV_USER_HEADER = "x-hydrovision-dev-user";

/** true cuando la simulación de usuario está bloqueada (producción). */
export function isSimulatedAuthBlocked(): boolean {
  return process.env.NODE_ENV === "production";
}

export const ANONYMOUS_PRODUCTION_USER: AuthUserContext = Object.freeze({
  id: "anonymous",
  name: "Visitante sin autenticar",
  email: "",
  role: "VIEWER",
  status: "active",
  isSimulated: true,
  authMode: "production-anonymous",
});

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

/** Id del usuario simulado en desarrollo; null en producción (simulación bloqueada). */
export function resolveDevUserId(request?: Request): string | null {
  if (isSimulatedAuthBlocked()) return null;
  const header = request?.headers.get(DEV_USER_HEADER);
  if (header?.trim()) return header.trim();
  return process.env.DEV_SIMULATED_USER_ID?.trim() || DEFAULT_DEV_USER_ID;
}

export async function getSimulatedUserContext(request?: Request): Promise<AuthUserContext> {
  const userId = resolveDevUserId(request);
  if (userId === null) return { ...ANONYMOUS_PRODUCTION_USER };

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
