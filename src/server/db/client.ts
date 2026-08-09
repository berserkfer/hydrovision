/**
 * Prisma Client singleton — Sprint 3A
 *
 * Evita instancias múltiples en desarrollo (hot reload) y centraliza
 * la configuración del cliente para rutas API y repositorios server-side.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = undefined;
  }
}

export async function isDatabaseReachable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
