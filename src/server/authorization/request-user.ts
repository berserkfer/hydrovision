/**
 * Usuario de una petición:
 *  1. sesión real (cookie httpOnly firmada) → usuario leído de la base en cada petición;
 *  2. si no hay sesión y NODE_ENV=development → usuario simulado de desarrollo;
 *  3. en cualquier otro caso → null (las rutas protegidas responden 401).
 */

import { SESSION_COOKIE_NAME } from "@/server/auth/auth.config";
import { readSessionCookie, verifySessionToken } from "@/server/auth/session";
import { findAuthUserById, type AuthUserRecord } from "@/server/auth/user-credentials.repository";
import { getSimulatedUserContext, type AuthUserContext } from "./dev-user-context";

export interface RequestUserDeps {
  findUserById: (id: string) => Promise<AuthUserRecord | null>;
  simulatedUser: (request: Request) => Promise<AuthUserContext | null>;
}

const defaultDeps: RequestUserDeps = {
  findUserById: findAuthUserById,
  simulatedUser: getSimulatedUserContext,
};

export function toSessionUserContext(record: AuthUserRecord): AuthUserContext {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.active ? "active" : "inactive",
    isSimulated: false,
    authMode: "session",
  };
}

/** Usuario de la sesión, si la cookie es válida y el usuario existe. */
export async function getSessionUser(
  request: Request,
  deps: Pick<RequestUserDeps, "findUserById"> = defaultDeps
): Promise<AuthUserContext | null> {
  const payload = await verifySessionToken(readSessionCookie(request, SESSION_COOKIE_NAME));
  if (!payload) return null;
  try {
    const record = await deps.findUserById(payload.sub);
    return record ? toSessionUserContext(record) : null;
  } catch {
    return null;
  }
}

export async function resolveRequestUser(
  request: Request,
  deps: RequestUserDeps = defaultDeps
): Promise<AuthUserContext | null> {
  const sessionUser = await getSessionUser(request, deps);
  if (sessionUser) return sessionUser;
  return deps.simulatedUser(request);
}
