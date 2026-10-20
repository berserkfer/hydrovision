/**
 * Límite de peticiones en memoria por clave (IP o identificador).
 * Ventana fija simple: suficiente para proteger las rutas satelitales.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }

    if (bucket.count >= this.limit) {
      const retryAfterMs = this.windowMs - (now - bucket.windowStart);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: this.limit - bucket.count,
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.buckets.clear();
  }

  get size(): number {
    return this.buckets.size;
  }
}

/** 30 peticiones por minuto por IP para las rutas satelitales. */
export const satelliteRateLimiter = new FixedWindowRateLimiter(30, 60_000);

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
