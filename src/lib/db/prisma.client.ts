/**
 * Cliente Prisma — Fase 3.2
 *
 * Este módulo se activará cuando USE_DATABASE=true y se ejecute `npx prisma generate`.
 * Por ahora NO se importa desde ningún componente para mantener compatibilidad con mock.
 *
 * Uso futuro:
 * ```typescript
 * import { getPrismaClient } from "@/lib/db/prisma.client";
 * const db = getPrismaClient();
 * const estaciones = await db.estacion.findMany({ where: { rioId: "rio-reque" } });
 * ```
 */

import { isDatabaseConfigured } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;

let prismaInstance: PrismaClientType | null = null;

/**
 * Obtiene instancia singleton de PrismaClient.
 * Lanza error si la BD no está configurada — evita conexiones accidentales en Fase 3.1.
 */
export function getPrismaClient(): PrismaClientType {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "[HydroVision] PostgreSQL no configurado. " +
        "Establezca USE_DATABASE=true y DATABASE_URL en .env, luego ejecute: npx prisma generate"
    );
  }

  if (!prismaInstance) {
    // Importación dinámica — solo cuando se active la BD (Fase 3.2)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => PrismaClientType };
    prismaInstance = new PrismaClient();
  }

  return prismaInstance;
}

export { isDatabaseConfigured };
