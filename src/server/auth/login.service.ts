/**
 * Inicio de sesión con correo y contraseña.
 * Mensaje de error único para "correo inexistente" y "contraseña incorrecta" (no revela qué
 * cuentas existen) y tiempo de respuesta equivalente en ambos casos.
 */

import { ApiError } from "@/server/api/errors";
import { burnPasswordCheck, verifyPassword } from "./password";
import { createSessionToken } from "./session";
import {
  findAuthUserByEmail,
  isAuthDatabaseAvailable,
  type AuthUserRecord,
} from "./user-credentials.repository";

export const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

export interface LoginDeps {
  databaseAvailable: () => boolean;
  findUserByEmail: (email: string) => Promise<AuthUserRecord | null>;
}

const defaultDeps: LoginDeps = {
  databaseAvailable: isAuthDatabaseAvailable,
  findUserByEmail: findAuthUserByEmail,
};

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role: AuthUserRecord["role"] };
}

export async function loginWithPassword(
  email: string,
  password: string,
  deps: LoginDeps = defaultDeps
): Promise<LoginResult> {
  if (!deps.databaseAvailable()) {
    throw ApiError.database(
      "El inicio de sesión requiere la base de datos (DATABASE_URL). Sin ella solo funciona el usuario simulado de desarrollo."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw ApiError.validation("Correo y contraseña son obligatorios.");
  }

  const user = await deps.findUserByEmail(normalizedEmail);
  if (!user || !user.passwordHash) {
    await burnPasswordCheck(password);
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  if (!user.active) throw ApiError.forbidden("La cuenta está desactivada.");

  return {
    token: await createSessionToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
