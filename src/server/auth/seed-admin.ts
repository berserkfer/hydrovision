/**
 * Creación del primer ADMIN a partir de variables de entorno (ver scripts/seed-admin.ts).
 *
 *   HV_ADMIN_EMAIL        correo del administrador (obligatorio)
 *   HV_ADMIN_PASSWORD     contraseña (obligatoria, ≥ 12 caracteres con letras y números)
 *   HV_ADMIN_NAME         nombre visible (opcional, por defecto "Administrador")
 *   HV_ADMIN_INSTITUTION  institución (opcional)
 *   HV_ADMIN_RESET=true   permite reemplazar la contraseña si el correo ya tiene una
 *
 * Nunca imprime ni guarda la contraseña en claro: solo su hash bcrypt.
 */

import { hashPassword, validatePasswordStrength } from "./password";

export interface SeedAdminInput {
  email: string | undefined;
  password: string | undefined;
  name?: string;
  institution?: string;
  reset?: boolean;
}

export interface ExistingUser {
  id: string;
  hasPassword: boolean;
}

export interface SeedAdminDeps {
  findByEmail: (email: string) => Promise<ExistingUser | null>;
  create: (data: { id: string; email: string; name: string; institution: string; passwordHash: string }) => Promise<void>;
  promoteAndSetPassword: (id: string, passwordHash: string | null) => Promise<void>;
  newId: () => string;
}

export type SeedAdminResult =
  | { status: "created"; email: string }
  | { status: "updated"; email: string }
  | { status: "promoted"; email: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readSeedAdminInputFromEnv(env: NodeJS.ProcessEnv = process.env): SeedAdminInput {
  return {
    email: env.HV_ADMIN_EMAIL,
    password: env.HV_ADMIN_PASSWORD,
    name: env.HV_ADMIN_NAME,
    institution: env.HV_ADMIN_INSTITUTION,
    reset: env.HV_ADMIN_RESET === "true",
  };
}

export async function seedAdmin(input: SeedAdminInput, deps: SeedAdminDeps): Promise<SeedAdminResult> {
  const email = input.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) {
    throw new Error("HV_ADMIN_EMAIL falta o no es un correo válido.");
  }
  if (!input.password) {
    throw new Error("HV_ADMIN_PASSWORD es obligatoria (no se aceptan contraseñas por defecto).");
  }
  const weakness = validatePasswordStrength(input.password);
  if (weakness) throw new Error(`HV_ADMIN_PASSWORD no es válida: ${weakness}`);

  const existing = await deps.findByEmail(email);

  if (!existing) {
    await deps.create({
      id: deps.newId(),
      email,
      name: input.name?.trim() || "Administrador",
      institution: input.institution?.trim() || "HydroVision",
      passwordHash: await hashPassword(input.password),
    });
    return { status: "created", email };
  }

  if (existing.hasPassword && !input.reset) {
    // Ya tiene contraseña: solo se garantiza el rol ADMIN, sin pisar la contraseña.
    await deps.promoteAndSetPassword(existing.id, null);
    return { status: "promoted", email };
  }

  await deps.promoteAndSetPassword(existing.id, await hashPassword(input.password));
  return { status: "updated", email };
}
