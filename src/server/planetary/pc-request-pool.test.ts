import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PlanetaryHttpError,
  backoffDelayMs,
  createLimiter,
  parseRetryAfter,
  planetaryFetch,
  withRetry,
} from "./pc-request-pool";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("createLimiter", () => {
  it("nunca supera el máximo de tareas simultáneas", async () => {
    const limiter = createLimiter(2);
    let active = 0;
    let peak = 0;
    const task = () =>
      limiter.run(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 5));
        active -= 1;
        return true;
      });

    const results = await Promise.all(Array.from({ length: 8 }, task));
    expect(results.every(Boolean)).toBe(true);
    expect(peak).toBe(2);
    expect(limiter.active).toBe(0);
    expect(limiter.pending).toBe(0);
  });

  it("libera el turno aunque la tarea falle", async () => {
    const limiter = createLimiter(1);
    await expect(limiter.run(async () => Promise.reject(new Error("x")))).rejects.toThrow("x");
    await expect(limiter.run(async () => "ok")).resolves.toBe("ok");
  });
});

describe("withRetry", () => {
  it("reintenta un 429 respetando Retry-After y luego tiene éxito", async () => {
    const waits: number[] = [];
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls === 1) throw new PlanetaryHttpError("429", 429, 2000);
        return "ok";
      },
      { sleep: async (ms) => void waits.push(ms) }
    );
    expect(result).toBe("ok");
    expect(waits).toEqual([2000]);
  });

  it("usa espera exponencial cuando no hay Retry-After", async () => {
    const waits: number[] = [];
    await expect(
      withRetry(
        async () => {
          throw new PlanetaryHttpError("503", 503);
        },
        { maxRetries: 3, sleep: async (ms) => void waits.push(ms), random: () => 1 }
      )
    ).rejects.toBeInstanceOf(PlanetaryHttpError);
    expect(waits).toEqual([500, 1000, 2000]);
  });

  it("no reintenta errores definitivos (404)", async () => {
    const sleep = vi.fn(async () => {});
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new PlanetaryHttpError("404", 404);
        },
        { sleep }
      )
    ).rejects.toBeInstanceOf(PlanetaryHttpError);
    expect(calls).toBe(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe("utilidades", () => {
  it("interpreta Retry-After en segundos", () => {
    expect(parseRetryAfter("3")).toBe(3000);
    expect(parseRetryAfter(null)).toBeNull();
  });

  it("acota la espera exponencial", () => {
    expect(backoffDelayMs(1, () => 0)).toBe(250);
    expect(backoffDelayMs(20, () => 1)).toBe(8000);
  });
});

describe("planetaryFetch", () => {
  it("convierte un 429 en reintento y devuelve la respuesta correcta", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 429, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = planetaryFetch("https://planetarycomputer.microsoft.com/api/x");
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual({ ok: true });
  });
});
