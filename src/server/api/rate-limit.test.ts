import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "@/server/api/rate-limit";

describe("FixedWindowRateLimiter", () => {
  it("permite hasta el límite y bloquea la siguiente", () => {
    const limiter = new FixedWindowRateLimiter(2, 60_000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 1).allowed).toBe(true);
    const blocked = limiter.check("ip", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reinicia la ventana al pasar el tiempo", () => {
    const limiter = new FixedWindowRateLimiter(1, 1000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 500).allowed).toBe(false);
    expect(limiter.check("ip", 1001).allowed).toBe(true);
  });

  it("mantiene claves independientes", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
  });

  it("informa los intentos restantes", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    expect(limiter.check("ip", 0).remaining).toBe(2);
    expect(limiter.check("ip", 1).remaining).toBe(1);
    expect(limiter.check("ip", 2).remaining).toBe(0);
  });
});
