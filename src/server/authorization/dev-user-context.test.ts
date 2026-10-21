/**
 * Bloqueo del usuario simulado en producción.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEV_USER_HEADER,
  getSimulatedUserContext,
  isSimulatedAuthBlocked,
  resolveDevUserId,
} from "./dev-user-context";
import { authorizationService } from "./authorization.service";
import { ApiError } from "@/server/api/errors";

function requestAs(userId?: string): Request {
  const headers = new Headers();
  if (userId) headers.set(DEV_USER_HEADER, userId);
  return new Request("http://localhost/api/test", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("usuario simulado en desarrollo", () => {
  it("respeta el header x-hydrovision-dev-user", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await getSimulatedUserContext(requestAs("usr-investigador"));
    expect(user.id).toBe("usr-investigador");
    expect(user.role).toBe("INVESTIGATOR");
    expect(user.authMode).toBe("dev-simulated");
  });

  it("sin header usa ADMIN por defecto (solo en desarrollo)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await getSimulatedUserContext(requestAs());
    expect(user.role).toBe("ADMIN");
  });
});

describe("usuario simulado en producción", () => {
  it("queda bloqueado", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isSimulatedAuthBlocked()).toBe(true);
    expect(resolveDevUserId(requestAs("usr-admin"))).toBeNull();
  });

  it("el header x-hydrovision-dev-user no tiene efecto", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const user = await getSimulatedUserContext(requestAs("usr-admin"));
    expect(user.id).toBe("anonymous");
    expect(user.role).toBe("VIEWER");
    expect(user.authMode).toBe("production-anonymous");
  });

  it("no asigna ADMIN por defecto, ni siquiera con DEV_SIMULATED_USER_ID", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_SIMULATED_USER_ID", "usr-admin");
    const user = await getSimulatedUserContext(requestAs());
    expect(user.role).not.toBe("ADMIN");
    expect(user.role).toBe("VIEWER");
  });

  it("rechaza con 403 una acción de administración aunque se envíe el header de admin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const attempt = authorizationService.authorize(requestAs("usr-admin"), "MANAGE_USERS");
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({ status: 403 });
  });

  it("permite la lectura pública", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const user = await authorizationService.authorize(requestAs(), "STATIONS_VIEW");
    expect(user.role).toBe("VIEWER");
  });
});
