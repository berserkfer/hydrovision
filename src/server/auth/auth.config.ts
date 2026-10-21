/**
 * Configuración de autenticación — sin secretos en el código.
 *
 *   AUTH_SECRET            secreto HMAC de la cookie de sesión (≥ 32 caracteres). Obligatorio
 *                          fuera de desarrollo; en desarrollo, si falta, se genera uno efímero
 *                          por proceso (las sesiones se pierden al reiniciar).
 *   AUTH_SESSION_TTL_HOURS duración de la sesión (por defecto 8 h).
 *   AUTH_BCRYPT_ROUNDS     coste de bcrypt (por defecto 12, mínimo 10).
 */

export const SESSION_COOKIE_NAME = "hv_session";
export const DEFAULT_SESSION_TTL_HOURS = 8;
export const DEFAULT_BCRYPT_ROUNDS = 12;
export const MIN_BCRYPT_ROUNDS = 10;
export const MIN_AUTH_SECRET_LENGTH = 32;
/** Longitud mínima de contraseña aceptada al crear/cambiar credenciales. */
export const MIN_PASSWORD_LENGTH = 12;

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function getSessionTtlSeconds(): number {
  const hours = Number(process.env.AUTH_SESSION_TTL_HOURS);
  const valid = Number.isFinite(hours) && hours > 0 && hours <= 24 * 30;
  return Math.round((valid ? hours : DEFAULT_SESSION_TTL_HOURS) * 3600);
}

export function getBcryptRounds(): number {
  const rounds = Number.parseInt(process.env.AUTH_BCRYPT_ROUNDS ?? "", 10);
  if (!Number.isFinite(rounds)) return DEFAULT_BCRYPT_ROUNDS;
  return Math.min(Math.max(rounds, MIN_BCRYPT_ROUNDS), 15);
}

let ephemeralDevSecret: string | null = null;

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Secreto de firma de sesión. Fuera de desarrollo, sin AUTH_SECRET válido no hay sesiones
 * (se devuelve null y toda verificación falla): nunca se firma con un secreto por defecto.
 */
export function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  if (secret.length >= MIN_AUTH_SECRET_LENGTH) return secret;
  if (isDevelopment()) {
    ephemeralDevSecret ??= randomSecret();
    return ephemeralDevSecret;
  }
  return null;
}
