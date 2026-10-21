import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSeedAdminInputFromEnv, seedAdmin, type SeedAdminDeps } from "./seed-admin";
import { verifyPassword } from "./password";

// Valor solo de prueba, generado aquí.
const STRONG = `semilla-${Date.now()}-a1`;

function fakeDb(existing?: { id: string; hasPassword: boolean }) {
  const created: Array<{ email: string; passwordHash: string }> = [];
  const updates: Array<{ id: string; passwordHash: string | null }> = [];
  const deps: SeedAdminDeps = {
    findByEmail: async () => existing ?? null,
    create: async (data) => void created.push(data),
    promoteAndSetPassword: async (id, passwordHash) => void updates.push({ id, passwordHash }),
    newId: () => "usr-nuevo",
  };
  return { deps, created, updates };
}

beforeEach(() => vi.stubEnv("AUTH_BCRYPT_ROUNDS", "10"));
afterEach(() => vi.unstubAllEnvs());

describe("seed del primer ADMIN", () => {
  it("lee las credenciales de variables de entorno", () => {
    const input = readSeedAdminInputFromEnv({
      HV_ADMIN_EMAIL: "admin@hydrovision.test",
      HV_ADMIN_PASSWORD: STRONG,
      HV_ADMIN_RESET: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(input).toMatchObject({ email: "admin@hydrovision.test", password: STRONG, reset: true });
  });

  it("crea el ADMIN guardando solo el hash", async () => {
    const { deps, created } = fakeDb();
    const result = await seedAdmin({ email: "Admin@HydroVision.test", password: STRONG }, deps);
    expect(result).toEqual({ status: "created", email: "admin@hydrovision.test" });
    expect(created[0].passwordHash).not.toContain(STRONG);
    expect(await verifyPassword(STRONG, created[0].passwordHash)).toBe(true);
  });

  it("sin contraseña en el entorno no crea nada (no hay contraseña por defecto)", async () => {
    const { deps, created } = fakeDb();
    await expect(seedAdmin({ email: "a@b.pe", password: undefined }, deps)).rejects.toThrow(
      /HV_ADMIN_PASSWORD/
    );
    expect(created).toHaveLength(0);
  });

  it("rechaza contraseñas débiles y correos inválidos", async () => {
    const { deps } = fakeDb();
    await expect(seedAdmin({ email: "a@b.pe", password: "corta1" }, deps)).rejects.toThrow();
    await expect(seedAdmin({ email: "no-es-correo", password: STRONG }, deps)).rejects.toThrow();
  });

  it("si el usuario ya tiene contraseña, solo garantiza el rol sin pisarla", async () => {
    const { deps, updates } = fakeDb({ id: "usr-1", hasPassword: true });
    const result = await seedAdmin({ email: "a@b.pe", password: STRONG }, deps);
    expect(result.status).toBe("promoted");
    expect(updates).toEqual([{ id: "usr-1", passwordHash: null }]);
  });

  it("con HV_ADMIN_RESET=true reemplaza la contraseña", async () => {
    const { deps, updates } = fakeDb({ id: "usr-1", hasPassword: true });
    const result = await seedAdmin({ email: "a@b.pe", password: STRONG, reset: true }, deps);
    expect(result.status).toBe("updated");
    expect(await verifyPassword(STRONG, updates[0].passwordHash)).toBe(true);
  });
});
