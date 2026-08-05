/**
 * PrismaService — Singleton de acceso a PostgreSQL (Fase 5.0)
 * PrismaClient se resuelve en runtime tras `prisma generate`.
 */

import { databaseConfig } from "@/config/database.config";

type PrismaClientInstance = import("@prisma/client").PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __hydrovisionPrisma: PrismaClientInstance | undefined;
}

async function loadPrismaClient(): Promise<new () => PrismaClientInstance> {
  const { PrismaClient } = await import("@prisma/client");
  return PrismaClient;
}

export class PrismaService {
  private static client: PrismaClientInstance | null = null;

  static async getClient(): Promise<PrismaClientInstance> {
    if (!databaseConfig.databaseUrl) {
      throw new Error("[PrismaService] DATABASE_URL no configurada.");
    }

    if (process.env.NODE_ENV !== "production") {
      if (!global.__hydrovisionPrisma) {
        const PrismaClient = await loadPrismaClient();
        global.__hydrovisionPrisma = new PrismaClient({
          log: ["error", "warn"],
        });
      }
      return global.__hydrovisionPrisma;
    }

    if (!this.client) {
      const PrismaClient = await loadPrismaClient();
      this.client = new PrismaClient({ log: ["error"] });
    }
    return this.client;
  }

  static async isConnected(): Promise<boolean> {
    if (!databaseConfig.databaseUrl) {
      return false;
    }

    try {
      const client = await this.getClient();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  static async disconnect(): Promise<void> {
    const client =
      process.env.NODE_ENV !== "production" ? global.__hydrovisionPrisma : this.client;

    if (client) {
      await client.$disconnect();
    }

    if (process.env.NODE_ENV !== "production") {
      global.__hydrovisionPrisma = undefined;
    }
    this.client = null;
  }
}
