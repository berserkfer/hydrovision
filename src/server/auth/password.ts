/**
 * Hash y verificación de contraseñas con bcrypt (bcryptjs, sin dependencias nativas).
 * Nunca se guarda ni se registra la contraseña en claro.
 */

import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH, getBcryptRounds } from "./auth.config";

export async function hashPassword(password: string, rounds = getBcryptRounds()): Promise<string> {
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Hash de referencia para igualar el tiempo de respuesta cuando el correo no existe. */
let timingDummyHash: Promise<string> | null = null;

/**
 * Compara contra un hash ficticio para que "correo inexistente" y "contraseña incorrecta"
 * tarden lo mismo (evita enumerar cuentas por tiempo de respuesta).
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  timingDummyHash ??= bcrypt.hash("hydrovision-timing-equalizer", getBcryptRounds());
  await bcrypt.compare(password, await timingDummyHash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe combinar letras y números.";
  }
  return null;
}
