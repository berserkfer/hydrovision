/**
 * Token de sesión firmado (HMAC-SHA256) para la cookie httpOnly.
 *
 * Formato: base64url(JSON payload) + "." + base64url(firma). El payload solo lleva el id de
 * usuario y las fechas: el rol y el estado se leen de la base en cada petición, así que un
 * cambio de rol o una desactivación aplica de inmediato.
 *
 * Usa Web Crypto (globalThis.crypto.subtle) para funcionar igual en el middleware (Edge)
 * y en las rutas (Node).
 */

import { getAuthSecret, getSessionTtlSeconds } from "./auth.config";

export interface SessionPayload {
  /** id del usuario */
  sub: string;
  /** emitido (segundos epoch) */
  iat: number;
  /** expira (segundos epoch) */
  exp: number;
}

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(
  userId: string,
  options?: { secret?: string | null; ttlSeconds?: number; nowSeconds?: number }
): Promise<string> {
  const secret = options?.secret === undefined ? getAuthSecret() : options.secret;
  if (!secret) throw new Error("AUTH_SECRET no configurado: no se pueden emitir sesiones.");
  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat: now,
    exp: now + (options?.ttlSeconds ?? getSessionTtlSeconds()),
  };
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(secret, body));
  return `${body}.${signature}`;
}

/** Devuelve el payload si la firma es válida y no expiró; null en cualquier otro caso. */
export async function verifySessionToken(
  token: string | null | undefined,
  options?: { secret?: string | null; nowSeconds?: number }
): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = options?.secret === undefined ? getAuthSecret() : options.secret;
  if (!secret) return null;

  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const given = base64UrlDecode(signature);
  if (!given) return null;
  const expected = await hmac(secret, body);
  if (!timingSafeEqual(given, expected)) return null;

  const raw = base64UrlDecode(body);
  if (!raw) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(raw)) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.sub !== "string" || !payload.sub || typeof payload.exp !== "number") return null;

  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  return payload;
}

/** Lee la cookie de sesión de una Request (sin depender de next/headers). */
export function readSessionCookie(request: Request, cookieName: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === cookieName) return decodeURIComponent(rest.join("="));
  }
  return null;
}
