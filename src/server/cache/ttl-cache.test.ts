import { afterEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "@/server/cache/ttl-cache";

afterEach(() => {
  vi.useRealTimers();
});

describe("TtlCache", () => {
  it("devuelve el valor antes de expirar", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("a", "valor");
    expect(cache.get("a")).toBe("valor");
  });

  it("expira después del TTL", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set("a", "valor");
    vi.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("desaloja la entrada más antigua al superar el máximo", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.size).toBe(2);
  });
});
