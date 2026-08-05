/**
 * Configuración de base de datos — PostgreSQL / Prisma (Fase 5.0)
 */

import { dataSourceConfig } from "./data-source.config";

export const databaseConfig = {
  /** Activo cuando DATA_SOURCE=database o USE_DATABASE=true (legacy) */
  isDatabaseEnabled:
    dataSourceConfig.source === "database" || process.env.USE_DATABASE === "true",
  databaseUrl: process.env.DATABASE_URL ?? "",
  timezone: process.env.TZ ?? "America/Lima",
  schemaVersion: dataSourceConfig.schemaVersion,
} as const;

export function isDatabaseConfigured(): boolean {
  return databaseConfig.isDatabaseEnabled && databaseConfig.databaseUrl.length > 0;
}
