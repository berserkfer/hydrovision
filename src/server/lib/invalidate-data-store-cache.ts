/**
 * Invalida y recarga el HydroVisionDataStore cuando DATA_SOURCE=database.
 * Llamar tras mutaciones Prisma para mantener coherencia con motores científicos.
 */

import { dataSourceConfig } from "@/config/data-source.config";

export async function invalidateMonitoringDataStoreCache(): Promise<void> {
  if (dataSourceConfig.source !== "database") {
    return;
  }

  try {
    const { databaseDataProvider } = await import("@/providers/database-data.provider");
    databaseDataProvider.resetCache();
    await databaseDataProvider.initialize();
  } catch (error) {
    console.warn("[invalidateMonitoringDataStoreCache]", error);
  }
}

export async function ensureMonitoringDataStoreReady(): Promise<void> {
  if (dataSourceConfig.source !== "database") {
    return;
  }

  const { databaseDataProvider, initializeDatabaseProviderIfNeeded } = await import(
    "@/providers/database-data.provider"
  );
  await initializeDatabaseProviderIfNeeded();
  if (!databaseDataProvider.isAvailable()) {
    throw new Error(
      "[ensureMonitoringDataStoreReady] PostgreSQL no disponible con DATA_SOURCE=database"
    );
  }
}
