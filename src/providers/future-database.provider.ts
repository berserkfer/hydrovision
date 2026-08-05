/**
 * FutureDatabaseProvider — acceso diferido (Fase 5.0)
 * Importar desde `@/providers/database-data.provider` solo en servidor/DB.
 */

export type { DatabaseDataProvider } from "./database-data.provider";

export async function getDatabaseDataProvider() {
  const mod = await import("./database-data.provider");
  return mod.databaseDataProvider;
}

export async function initializeDatabaseProviderIfNeeded() {
  const mod = await import("./database-data.provider");
  return mod.initializeDatabaseProviderIfNeeded();
}

/** @deprecated Use getDatabaseDataProvider() — alias lazy */
export async function getFutureDatabaseProvider() {
  return getDatabaseDataProvider();
}
