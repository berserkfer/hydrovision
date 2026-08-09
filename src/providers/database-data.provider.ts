/**
 * DatabaseDataProvider — proveedor PostgreSQL via Prisma (Fase 5.0)
 * Prisma se carga dinámicamente solo cuando DATA_SOURCE=database.
 */

import { dataSourceConfig } from "@/config";
import { isDatabaseConfigured } from "@/config/database.config";
import type { HydroVisionDataStore } from "@/models";
import type { IDataProvider, DataProviderMetadata } from "@/types/data-provider";
import { buildSnapshot } from "./provider.utils";

const EMPTY_STORE: HydroVisionDataStore = {
  departamentos: [],
  provincias: [],
  distritos: [],
  cuencas: [],
  rios: [],
  estaciones: [],
  campanas: [],
  muestras: [],
  parametros: [],
  clasificaciones: [],
  indicesSatelitales: [],
  usuarios: [],
  reportes: [],
};

export class DatabaseDataProvider implements IDataProvider {
  private storeCache: HydroVisionDataStore | null = null;
  private connectionVerified = false;
  private connectionAvailable = false;

  getMetadata(): DataProviderMetadata {
    return {
      source: "database",
      isSimulated: false,
      isConnected: this.connectionAvailable && this.storeCache !== null,
      version: dataSourceConfig.schemaVersion,
      lastUpdate: new Date().toISOString(),
      description: "Proveedor PostgreSQL — Prisma ORM (Fase 5.0)",
    };
  }

  getSnapshot() {
    return buildSnapshot(this.storeCache ?? EMPTY_STORE, this.getMetadata());
  }

  getStore(): HydroVisionDataStore {
    if (!this.storeCache) {
      throw new Error(
        "[DatabaseDataProvider] Store no inicializado. Ejecute await databaseDataProvider.initialize() antes de getStore()."
      );
    }
    return this.storeCache;
  }

  isAvailable(): boolean {
    if (!isDatabaseConfigured()) {
      return false;
    }
    return this.storeCache !== null || this.connectionAvailable;
  }

  /** Verifica conexión y carga el store desde PostgreSQL */
  async initialize(): Promise<HydroVisionDataStore> {
    if (this.storeCache) {
      return this.storeCache;
    }

    const { PrismaService } = await import("@/database/prisma.service");
    const { prismaDataStoreLoader } = await import(
      "@/database/repositories/prisma-data-store.loader"
    );

    this.connectionAvailable = await PrismaService.isConnected();
    this.connectionVerified = true;

    if (!this.connectionAvailable) {
      throw new Error(
        "[DatabaseDataProvider] No se pudo conectar a PostgreSQL. Verifique DATABASE_URL y que el servicio esté activo."
      );
    }

    this.storeCache = await prismaDataStoreLoader.loadStore();
    return this.storeCache;
  }

  resetCache(): void {
    this.storeCache = null;
    this.connectionVerified = false;
    this.connectionAvailable = false;
  }

  async verifyConnection(): Promise<boolean> {
    if (this.connectionVerified) {
      return this.connectionAvailable;
    }

    if (!isDatabaseConfigured()) {
      this.connectionVerified = true;
      this.connectionAvailable = false;
      return false;
    }

    const { PrismaService } = await import("@/database/prisma.service");
    this.connectionAvailable = await PrismaService.isConnected();
    this.connectionVerified = true;
    return this.connectionAvailable;
  }
}

export const databaseDataProvider = new DatabaseDataProvider();

export async function initializeDatabaseProviderIfNeeded(): Promise<void> {
  if (dataSourceConfig.source !== "database") {
    return;
  }

  const connected = await databaseDataProvider.verifyConnection();
  if (connected) {
    await databaseDataProvider.initialize();
  }
}
