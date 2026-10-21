/**
 * Crea (o promueve) el primer ADMIN con credenciales leídas de variables de entorno.
 *
 *   HV_ADMIN_EMAIL="admin@ejemplo.pe" HV_ADMIN_PASSWORD="..." npm run seed:admin
 *
 * Requiere DATABASE_URL y la migración `20261021120000_auth_password_hash` aplicada.
 * Ver src/server/auth/seed-admin.ts para todas las variables.
 */

import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { readSeedAdminInputFromEnv, seedAdmin } from "../src/server/auth/seed-admin";

try {
  process.loadEnvFile?.(".env");
} catch {
  // sin .env: se usan solo las variables del entorno
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL no está configurada: el ADMIN se guarda en PostgreSQL.");
  }

  const prisma = new PrismaClient();
  try {
    const result = await seedAdmin(readSeedAdminInputFromEnv(), {
      findByEmail: async (email) => {
        const row = await prisma.usuario.findUnique({ where: { email } });
        return row ? { id: row.id, hasPassword: Boolean(row.passwordHash) } : null;
      },
      create: async (data) => {
        await prisma.usuario.create({
          data: {
            id: data.id,
            email: data.email,
            nombre: data.name,
            institucion: data.institution,
            rol: "admin",
            activo: true,
            passwordHash: data.passwordHash,
          },
        });
      },
      promoteAndSetPassword: async (id, passwordHash) => {
        await prisma.usuario.update({
          where: { id },
          data: {
            rol: "admin",
            activo: true,
            estado: "active",
            ...(passwordHash ? { passwordHash } : {}),
          },
        });
      },
      newId: () => `usr-${randomUUID()}`,
    });

    const messages = {
      created: "ADMIN creado",
      updated: "ADMIN actualizado (contraseña reemplazada)",
      promoted: "El usuario ya tenía contraseña: se garantizó el rol ADMIN sin cambiarla (use HV_ADMIN_RESET=true para reemplazarla)",
    } as const;
    console.log(`✓ ${messages[result.status]}: ${result.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
