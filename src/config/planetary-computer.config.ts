/**
 * Microsoft Planetary Computer — catálogo STAC público de Sentinel-2 L2A.
 *
 * A diferencia de GEE/Copernicus, NO requiere cuenta, client_id ni client_secret:
 * la búsqueda STAC y la firma de assets (SAS) son endpoints públicos sin autenticación.
 * Ver https://planetarycomputer.microsoft.com/docs/reference/stac/ y
 * https://planetarycomputer.microsoft.com/docs/concepts/sas/
 *
 * Por eso esta integración no tiene "modo simulado" por falta de credenciales — si el
 * adaptador falla, es por la red o por ausencia de escenas, nunca por configuración faltante.
 */

export const PLANETARY_COMPUTER_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
export const PLANETARY_COMPUTER_SIGN_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/sign";
export const PLANETARY_COMPUTER_COLLECTION = "sentinel-2-l2a" as const;

export function isPlanetaryComputerEnabled(): boolean {
  return process.env.PLANETARY_COMPUTER_ENABLED !== "false";
}

/**
 * Límites de consulta a Planetary Computer (evitan su límite de peticiones, sobre todo en la
 * firma SAS). Todos configurables por entorno; valores fuera de rango se acotan.
 *
 *   PLANETARY_MAX_CONCURRENCY       solicitudes simultáneas, 2–4 (por defecto 3)
 *   PLANETARY_MAX_RETRIES           reintentos ante 429 / 408 / 5xx / fallo de red, 0–6 (por defecto 3)
 *   PLANETARY_RETRY_BASE_DELAY_MS   espera del primer reintento, se duplica en cada uno (por defecto 500)
 *   PLANETARY_RETRY_MAX_DELAY_MS    tope de la espera entre reintentos (por defecto 8000)
 *   PLANETARY_STAC_CACHE_TTL_SECONDS vida de la caché de búsquedas STAC (por defecto 600)
 *   PLANETARY_STAC_CACHE_MAX_ENTRIES búsquedas STAC guardadas como máximo (por defecto 100)
 */
export interface PlanetaryRequestConfig {
  maxConcurrency: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  stacCacheTtlMs: number;
  stacCacheMaxEntries: number;
}

export const PLANETARY_CONCURRENCY_RANGE = { min: 2, max: 4, default: 3 } as const;

function intFromEnv(env: NodeJS.ProcessEnv, key: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(env[key] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function getPlanetaryRequestConfig(env: NodeJS.ProcessEnv = process.env): PlanetaryRequestConfig {
  const retryBaseDelayMs = intFromEnv(env, "PLANETARY_RETRY_BASE_DELAY_MS", 500, 1, 10_000);
  return {
    maxConcurrency: intFromEnv(
      env,
      "PLANETARY_MAX_CONCURRENCY",
      PLANETARY_CONCURRENCY_RANGE.default,
      PLANETARY_CONCURRENCY_RANGE.min,
      PLANETARY_CONCURRENCY_RANGE.max
    ),
    maxRetries: intFromEnv(env, "PLANETARY_MAX_RETRIES", 3, 0, 6),
    retryBaseDelayMs,
    retryMaxDelayMs: Math.max(retryBaseDelayMs, intFromEnv(env, "PLANETARY_RETRY_MAX_DELAY_MS", 8_000, 1, 60_000)),
    stacCacheTtlMs: intFromEnv(env, "PLANETARY_STAC_CACHE_TTL_SECONDS", 600, 0, 86_400) * 1000,
    stacCacheMaxEntries: intFromEnv(env, "PLANETARY_STAC_CACHE_MAX_ENTRIES", 100, 1, 5_000),
  };
}
