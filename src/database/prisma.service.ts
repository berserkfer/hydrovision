/**
 * PrismaService — Singleton de acceso a PostgreSQL (Fase 5.0 / Sprint 3A)
 * Delega en src/server/db para una única instancia de PrismaClient.
 */

import { databaseConfig } from "@/config/database.config";
import { disconnectPrisma, isDatabaseReachable, prisma } from "@/server/db";

type PrismaClientInstance = typeof prisma;

export class PrismaService {
  static async getClient(): Promise<PrismaClientInstance> {
    if (!databaseConfig.databaseUrl) {
      throw new Error("[PrismaService] DATABASE_URL no configurada.");
    }
    return prisma;
  }

  static async isConnected(): Promise<boolean> {
    if (!databaseConfig.databaseUrl) {
      return false;
    }
    return isDatabaseReachable();
  }

  static async disconnect(): Promise<void> {
    await disconnectPrisma();
  }
}
