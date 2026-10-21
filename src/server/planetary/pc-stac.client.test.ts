/**
 * Cliente STAC de Planetary Computer: reintentos ante 429/5xx, caché de búsquedas repetidas
 * y concurrencia limitada — con respuestas simuladas, sin red.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLANETARY_CONCURRENCY_RANGE,
  getPlanetaryRequestConfig,
} from "@/config/planetary-computer.config";
import { resetStacSearchCacheForTests, searchSentinel2Items } from "./pc-stac.client";
import { PlanetaryHttpError, resetPlanetaryLimiterForTests } from "./pc-request-pool";

const PARAMS = {
  latitude: -6.8764,
  longitude: -79.9282,
  startDate: "2026-09-01",
  endDate: "2026-10-01",
  cloudCoverMax: 30,
  limit: 5,
};

function stacOk(ids: string[]): Response {
  return new Response(
    JSON.stringify({
      features: ids.map((id) => ({ id, properties: { datetime: "2026-09-20T15:40:00Z" }, assets: {} })),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function tooMany(retryAfter?: string): Response {
  return new Response("Too Many Requests", {
    status: 429,
    headers: retryAfter ? { "retry-after": retryAfter } : {},
  });
}

beforeEach(() => {
  // Esperas mínimas para que las pruebas de reintento sean rápidas.
  vi.stubEnv("PLANETARY_RETRY_BASE_DELAY_MS", "1");
  vi.stubEnv("PLANETARY_RETRY_MAX_DELAY_MS", "5");
  resetStacSearchCacheForTests();
  resetPlanetaryLimiterForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetStacSearchCacheForTests();
  resetPlanetaryLimiterForTests();
});

describe("searchSentinel2Items — reintentos", () => {
  it("reintenta tras respuestas 429 y devuelve el resultado", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tooMany())
      .mockResolvedValueOnce(tooMany("0"))
      .mockResolvedValueOnce(stacOk(["S2A_1", "S2B_2"]));
    vi.stubGlobal("fetch", fetchMock);

    const items = await searchSentinel2Items(PARAMS);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(items.map((i) => i.id)).toEqual(["S2A_1", "S2B_2"]);
  });

  it("también reintenta ante 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(stacOk(["S2A_1"]));
    vi.stubGlobal("fetch", fetchMock);

    await searchSentinel2Items(PARAMS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("respeta PLANETARY_MAX_RETRIES y, agotados, propaga el 429 sin inventar datos", async () => {
    vi.stubEnv("PLANETARY_MAX_RETRIES", "2");
    const fetchMock = vi.fn().mockImplementation(async () => tooMany());
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchSentinel2Items(PARAMS)).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 intento + 2 reintentos
  });

  it("no reintenta un error definitivo (400)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchSentinel2Items(PARAMS)).rejects.toBeInstanceOf(PlanetaryHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("searchSentinel2Items — caché y concurrencia", () => {
  it("reutiliza búsquedas repetidas sin volver a consultar", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => stacOk(["S2A_1"]));
    vi.stubGlobal("fetch", fetchMock);

    await searchSentinel2Items(PARAMS);
    await searchSentinel2Items({ ...PARAMS });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await searchSentinel2Items({ ...PARAMS, limit: 10 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("búsquedas idénticas simultáneas comparten una sola petición", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => stacOk(["S2A_1"]));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all(Array.from({ length: 6 }, () => searchSentinel2Items(PARAMS)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("un fallo no queda en caché", async () => {
    vi.stubEnv("PLANETARY_MAX_RETRIES", "0");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tooMany())
      .mockResolvedValueOnce(stacOk(["S2A_1"]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchSentinel2Items(PARAMS)).rejects.toMatchObject({ status: 429 });
    await expect(searchSentinel2Items(PARAMS)).resolves.toHaveLength(1);
  });

  it("con PLANETARY_STAC_CACHE_TTL_SECONDS=0 no reutiliza", async () => {
    vi.stubEnv("PLANETARY_STAC_CACHE_TTL_SECONDS", "0");
    resetStacSearchCacheForTests();
    const fetchMock = vi.fn().mockImplementation(async () => stacOk(["S2A_1"]));
    vi.stubGlobal("fetch", fetchMock);

    await searchSentinel2Items(PARAMS);
    await searchSentinel2Items(PARAMS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("nunca supera PLANETARY_MAX_CONCURRENCY búsquedas simultáneas", async () => {
    vi.stubEnv("PLANETARY_MAX_CONCURRENCY", "2");
    resetPlanetaryLimiterForTests();
    let active = 0;
    let peak = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return stacOk(["S2A_1"]);
    });
    vi.stubGlobal("fetch", fetchMock);

    // Búsquedas distintas: no las une la caché, sí el cupo de concurrencia.
    await Promise.all(
      Array.from({ length: 7 }, (_, i) => searchSentinel2Items({ ...PARAMS, limit: i + 1 }))
    );
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(peak).toBe(2);
  });
});

describe("getPlanetaryRequestConfig", () => {
  it("usa valores por defecto razonables", () => {
    const config = getPlanetaryRequestConfig({} as NodeJS.ProcessEnv);
    expect(config.maxConcurrency).toBe(PLANETARY_CONCURRENCY_RANGE.default);
    expect(config.maxRetries).toBe(3);
    expect(config.stacCacheTtlMs).toBe(600_000);
  });

  it("acota la concurrencia entre 2 y 4", () => {
    const env = (v: string) => ({ PLANETARY_MAX_CONCURRENCY: v }) as unknown as NodeJS.ProcessEnv;
    expect(getPlanetaryRequestConfig(env("1")).maxConcurrency).toBe(2);
    expect(getPlanetaryRequestConfig(env("20")).maxConcurrency).toBe(4);
    expect(getPlanetaryRequestConfig(env("3")).maxConcurrency).toBe(3);
    expect(getPlanetaryRequestConfig(env("abc")).maxConcurrency).toBe(3);
  });
});
