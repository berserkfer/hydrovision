/**
 * Control de carga hacia Microsoft Planetary Computer.
 *
 * Planetary Computer limita la frecuencia de peticiones (sobre todo la firma SAS). Una sola
 * consulta de observaciones puede disparar 3 escenas × 6 bandas en paralelo, así que aquí se:
 *  - limita la concurrencia (PLANETARY_MAX_CONCURRENCY, por defecto 4);
 *  - reintenta ante 429 / 5xx / fallo de red con espera exponencial + jitter, respetando
 *    Retry-After (PLANETARY_MAX_RETRIES, por defecto 3 reintentos).
 *
 * Nunca se fabrica una respuesta: si se agotan los intentos, el error sube al llamador, que
 * ya trata el fallo como "sin datos".
 */

export const DEFAULT_PLANETARY_MAX_CONCURRENCY = 4;
export const DEFAULT_PLANETARY_MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8_000;

function envInt(key: string, fallback: number, min: number): number {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

export class PlanetaryHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number | null = null
  ) {
    super(message);
    this.name = "PlanetaryHttpError";
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

/** Retry-After en segundos o como fecha HTTP → milisegundos (acotado). */
export function parseRetryAfter(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(Math.max(0, seconds * 1000), MAX_DELAY_MS * 4);
  const date = Date.parse(value);
  if (Number.isFinite(date)) return Math.min(Math.max(0, date - now), MAX_DELAY_MS * 4);
  return null;
}

/** Espera exponencial con jitter "full" para el intento n (1 = primer reintento). */
export function backoffDelayMs(attempt: number, random = Math.random): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

/** Semáforo simple: como máximo `max` tareas a la vez, el resto espera en cola (FIFO). */
export function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const release = () => {
    active -= 1;
    const next = queue.shift();
    if (next) next();
  };

  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      if (active >= max) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }
      active += 1;
      try {
        return await task();
      } finally {
        release();
      }
    },
    get active() {
      return active;
    },
    get pending() {
      return queue.length;
    },
  };
}

export interface RetryOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Ejecuta `task` reintentando solo errores transitorios: PlanetaryHttpError con estado
 * reintentable, o errores de red (cualquier otro Error). Un PlanetaryHttpError no
 * reintentable (p. ej. 404) se propaga de inmediato.
 */
export async function withRetry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? envInt("PLANETARY_MAX_RETRIES", DEFAULT_PLANETARY_MAX_RETRIES, 0);
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const retryable =
        error instanceof PlanetaryHttpError ? isRetryableStatus(error.status) : true;
      if (!retryable || attempt >= maxRetries) throw error;
      const hinted = error instanceof PlanetaryHttpError ? error.retryAfterMs : null;
      await sleep(hinted ?? backoffDelayMs(attempt + 1, options.random));
    }
  }
}

const sharedLimiter = createLimiter(
  envInt("PLANETARY_MAX_CONCURRENCY", DEFAULT_PLANETARY_MAX_CONCURRENCY, 1)
);

/** Reserva un turno del cupo compartido de Planetary Computer para `task`. */
export function withPlanetarySlot<T>(task: () => Promise<T>): Promise<T> {
  return sharedLimiter.run(task);
}

/**
 * fetch hacia Planetary Computer con cupo compartido y reintentos. Devuelve la respuesta
 * correcta (2xx); un estado de error no reintentable se lanza como PlanetaryHttpError.
 */
export async function planetaryFetch(url: string, init?: RequestInit): Promise<Response> {
  return withRetry(() =>
    withPlanetarySlot(async () => {
      const response = await fetch(url, init);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new PlanetaryHttpError(
          `Planetary Computer respondió ${response.status}: ${text.slice(0, 200)}`,
          response.status,
          parseRetryAfter(response.headers.get("retry-after"))
        );
      }
      return response;
    })
  );
}
