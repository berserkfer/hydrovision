/**
 * Firma SAS pública de Microsoft Planetary Computer — sin cuenta ni API key.
 *
 * La firma es el endpoint más limitado de Planetary Computer y antes se pedía una vez por
 * banda y por escena. Ahora cada href firmado se reutiliza hasta poco antes de que caduque
 * (`msft:expiry`), y la petición pasa por el cupo compartido con reintentos.
 */

import { PLANETARY_COMPUTER_SIGN_URL } from "@/config/planetary-computer.config";
import { planetaryFetch } from "./pc-request-pool";

interface SignResponse {
  href?: string;
  "msft:expiry"?: string;
}

/** Margen antes de la expiración para no usar una firma a punto de caducar. */
const EXPIRY_SAFETY_MS = 5 * 60_000;
/** Si la respuesta no trae expiración, se reutiliza como máximo este tiempo. */
const DEFAULT_TTL_MS = 30 * 60_000;
const MAX_ENTRIES = 500;

const signedCache = new Map<string, { href: string; expiresAt: number }>();
const inFlight = new Map<string, Promise<string>>();

export function clearSignedHrefCache(): void {
  signedCache.clear();
  inFlight.clear();
}

function cacheSigned(href: string, signed: string, expiry: string | undefined): void {
  const parsed = expiry ? Date.parse(expiry) : Number.NaN;
  const expiresAt = Number.isFinite(parsed)
    ? parsed - EXPIRY_SAFETY_MS
    : Date.now() + DEFAULT_TTL_MS;
  if (expiresAt <= Date.now()) return;
  if (signedCache.size >= MAX_ENTRIES && !signedCache.has(href)) {
    const oldest = signedCache.keys().next().value;
    if (oldest !== undefined) signedCache.delete(oldest);
  }
  signedCache.set(href, { href: signed, expiresAt });
}

export async function signAssetHref(href: string): Promise<string> {
  const cached = signedCache.get(href);
  if (cached && cached.expiresAt > Date.now()) return cached.href;

  // Peticiones simultáneas por el mismo asset comparten una sola firma.
  const pending = inFlight.get(href);
  if (pending) return pending;

  const request = (async () => {
    const url = `${PLANETARY_COMPUTER_SIGN_URL}?href=${encodeURIComponent(href)}`;
    const response = await planetaryFetch(url, { cache: "no-store" });
    const data = (await response.json()) as SignResponse;
    if (!data.href) {
      throw new Error("Planetary Computer SAS sign no devolvió href firmado");
    }
    cacheSigned(href, data.href, data["msft:expiry"]);
    return data.href;
  })();

  inFlight.set(href, request);
  try {
    return await request;
  } finally {
    inFlight.delete(href);
  }
}
