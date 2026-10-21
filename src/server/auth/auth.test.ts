/**
 * Autenticación real: sesión firmada, contraseñas bcrypt, 401/403 y bloqueo del usuario
 * simulado fuera de desarrollo.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUserRecord } from "./user-credentials.repository";

// La base de usuarios se simula: estas pruebas no necesitan PostgreSQL.
const users = new Map<string, AuthUserRecord>();
vi.mock("./user-credentials.repository", () => ({
  isAuthDatabaseAvailable: () => true,
  findAuthUserById: async (id: string) => users.get(id) ?? null,
  findAuthUserByEmail: async (email: string) =>
    [...users.values()].find((u) => u.email === email) ?? null,
}));

import { SESSION_COOKIE_NAME } from "./auth.config";
import { createSessionToken, verifySessionToken } from "./session";
import { hashPassword, validatePasswordStrength, verifyPassword } from "./password";
import { INVALID_CREDENTIALS_MESSAGE, loginWithPassword } from "./login.service";
import { authorizationService } from "@/server/authorization/authorization.service";
import { DEV_USER_HEADER, getSimulatedUserContext } from "@/server/authorization/dev-user-context";
import { ApiError } from "@/server/api/errors";
import { GET as listUsers } from "@/app/api/users/route";
import { GET as authContext } from "@/app/api/auth/context/route";

const SECRET = "test-secret-0123456789-0123456789-abcdef";
// Contraseña solo de prueba, generada aquí: no es una credencial real.
const TEST_PASSWORD = `prueba-${Date.now()}-x9`;

function request(options: { cookie?: string; devUser?: string } = {}): Request {
  const headers = new Headers();
  if (options.cookie) headers.set("cookie", `${SESSION_COOKIE_NAME}=${options.cookie}`);
  if (options.devUser) headers.set(DEV_USER_HEADER, options.devUser);
  return new Request("http://localhost/api/test", { headers });
}

async function addUser(id: string, role: AuthUserRecord["role"], active = true) {
  users.set(id, {
    id,
    name: `Usuario ${id}`,
    email: `${id}@hydrovision.test`,
    role,
    active,
    passwordHash: await hashPassword(TEST_PASSWORD, 10),
  });
}

beforeEach(async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("AUTH_SECRET", SECRET);
  vi.stubEnv("AUTH_BCRYPT_ROUNDS", "10");
  users.clear();
  await addUser("admin-1", "ADMIN");
  await addUser("viewer-1", "VIEWER");
  await addUser("off-1", "INVESTIGATOR", false);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("token de sesión", () => {
  it("firma y verifica; rechaza firma alterada y token vencido", async () => {
    const token = await createSessionToken("admin-1", { ttlSeconds: 60 });
    expect((await verifySessionToken(token))?.sub).toBe("admin-1");

    const [body] = token.split(".");
    const forged = `${body}.AAAA${token.split(".")[1].slice(4)}`;
    expect(await verifySessionToken(forged)).toBeNull();

    const tamperedBody = btoa(JSON.stringify({ sub: "otro", iat: 0, exp: 9999999999 }))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(await verifySessionToken(`${tamperedBody}.${token.split(".")[1]}`)).toBeNull();

    const expired = await createSessionToken("admin-1", { ttlSeconds: 10, nowSeconds: 1000 });
    expect(await verifySessionToken(expired, { nowSeconds: 1011 })).toBeNull();
  });

  it("fuera de desarrollo, sin AUTH_SECRET no se emiten ni aceptan sesiones", async () => {
    const token = await createSessionToken("admin-1");
    vi.stubEnv("AUTH_SECRET", "");
    expect(await verifySessionToken(token)).toBeNull();
    await expect(createSessionToken("admin-1")).rejects.toThrow(/AUTH_SECRET/);
  });
});

describe("contraseñas", () => {
  it("guarda solo el hash bcrypt y lo verifica", async () => {
    const hash = await hashPassword(TEST_PASSWORD, 10);
    expect(hash).not.toContain(TEST_PASSWORD);
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword(TEST_PASSWORD, hash)).toBe(true);
    expect(await verifyPassword("otra-clave-123456", hash)).toBe(false);
    expect(await verifyPassword(TEST_PASSWORD, null)).toBe(false);
  });

  it("exige longitud mínima y letras con números", () => {
    expect(validatePasswordStrength("corta1")).not.toBeNull();
    expect(validatePasswordStrength("solo-letras-largas")).not.toBeNull();
    expect(validatePasswordStrength("letras-y-numeros-2026")).toBeNull();
  });
});

describe("autorización por sesión", () => {
  it("sin sesión responde 401", async () => {
    await expect(authorizationService.authorize(request(), "STATIONS_VIEW")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("con rol insuficiente responde 403", async () => {
    const cookie = await createSessionToken("viewer-1");
    await expect(
      authorizationService.authorize(request({ cookie }), "MANAGE_USERS")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("con el rol adecuado autoriza y marca la sesión como real", async () => {
    const cookie = await createSessionToken("admin-1");
    const user = await authorizationService.authorize(request({ cookie }), "MANAGE_USERS");
    expect(user.role).toBe("ADMIN");
    expect(user.authMode).toBe("session");
    expect(user.isSimulated).toBe(false);
  });

  it("un usuario desactivado con sesión válida recibe 403", async () => {
    const cookie = await createSessionToken("off-1");
    await expect(
      authorizationService.authorize(request({ cookie }), "STATIONS_VIEW")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("una sesión de un usuario que ya no existe equivale a no tener sesión (401)", async () => {
    const cookie = await createSessionToken("borrado-1");
    await expect(authorizationService.authorize(request({ cookie }), "STATIONS_VIEW")).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("usuario simulado", () => {
  it("queda bloqueado en producción: el header de admin no da acceso (401)", async () => {
    expect(await getSimulatedUserContext(request({ devUser: "usr-admin" }))).toBeNull();
    await expect(
      authorizationService.authorize(request({ devUser: "usr-admin" }), "MANAGE_USERS")
    ).rejects.toMatchObject({ status: 401 });
  });

  it("tampoco funciona en test ni con DEV_SIMULATED_USER_ID", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEV_SIMULATED_USER_ID", "usr-admin");
    expect(await getSimulatedUserContext(request())).toBeNull();
  });

  it("solo funciona con NODE_ENV=development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await getSimulatedUserContext(request({ devUser: "usr-investigador" }));
    expect(user?.role).toBe("INVESTIGATOR");
    expect(user?.authMode).toBe("dev-simulated");
  });
});

describe("inicio de sesión", () => {
  it("con credenciales correctas emite una sesión válida", async () => {
    const result = await loginWithPassword("ADMIN-1@hydrovision.test", TEST_PASSWORD);
    expect(result.user.role).toBe("ADMIN");
    expect((await verifySessionToken(result.token))?.sub).toBe("admin-1");
  });

  it("contraseña incorrecta y correo inexistente dan el mismo 401", async () => {
    const wrong = loginWithPassword("admin-1@hydrovision.test", "incorrecta-123456");
    const unknown = loginWithPassword("nadie@hydrovision.test", TEST_PASSWORD);
    await expect(wrong).rejects.toMatchObject({ status: 401, message: INVALID_CREDENTIALS_MESSAGE });
    await expect(unknown).rejects.toMatchObject({ status: 401, message: INVALID_CREDENTIALS_MESSAGE });
  });

  it("cuenta desactivada responde 403", async () => {
    await expect(loginWithPassword("off-1@hydrovision.test", TEST_PASSWORD)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("sin base de datos responde 503 en vez de fingir un login", async () => {
    const attempt = loginWithPassword("admin-1@hydrovision.test", TEST_PASSWORD, {
      databaseAvailable: () => false,
      findUserByEmail: async () => null,
    });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({ status: 503 });
  });
});

describe("rutas protegidas (handlers reales)", () => {
  it("GET /api/users sin sesión → 401", async () => {
    const response = await listUsers(request());
    expect(response.status).toBe(401);
  });

  it("GET /api/users con sesión VIEWER → 403", async () => {
    const response = await listUsers(request({ cookie: await createSessionToken("viewer-1") }));
    expect(response.status).toBe(403);
  });

  it("GET /api/auth/context ignora el header simulado en producción → 401", async () => {
    const response = await authContext(request({ devUser: "usr-admin" }));
    expect(response.status).toBe(401);
  });

  it("GET /api/auth/context con sesión devuelve el usuario real", async () => {
    const response = await authContext(request({ cookie: await createSessionToken("admin-1") }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { user: { id: string; authMode: string } } };
    expect(body.data.user).toMatchObject({ id: "admin-1", authMode: "session" });
  });
});
