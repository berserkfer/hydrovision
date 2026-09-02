/**
 * Contexto de usuario simulado para desarrollo — Sprint 3I
 * NO es autenticación real. Separado explícitamente para reemplazo futuro.
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
}

const DEFAULT_DEV_USER_ID = "usr-admin";

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
    };
  } catch {
    return null;
  }
}

export function resolveDevUserId(request?: Request): string {
  const header = request?.headers.get("x-hydrovision-dev-user");
  if (header?.trim()) return header.trim();
  return process.env.DEV_SIMULATED_USER_ID?.trim() || DEFAULT_DEV_USER_ID;
}

export async function getSimulatedUserContext(request?: Request): Promise<AuthUserContext> {
  const userId = resolveDevUserId(request);
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
    };
  }
  return user;
}
