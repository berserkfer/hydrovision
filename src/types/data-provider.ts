/**
 * Contrato IDataProvider — capa de abstracción de datos (Fase 4.6)
 */

import type { HydroVisionDataStore } from "@/models";

/** Origen de datos configurable */
export type DataSourceType = "mock" | "database" | "gee" | "api";

/** Metadatos del proveedor activo */
export interface DataProviderMetadata {
  source: DataSourceType;
  isSimulated: boolean;
  isConnected: boolean;
  version: string;
  lastUpdate: string;
  description: string;
}

/** Snapshot para validación de contrato entre proveedores */
export interface DataProviderSnapshot {
  metadata: DataProviderMetadata;
  storeKeys: (keyof HydroVisionDataStore)[];
  counts: Partial<Record<keyof HydroVisionDataStore, number>>;
}

/** Interfaz unificada — toda la aplicación consume IDataProvider */
export interface IDataProvider {
  getMetadata(): DataProviderMetadata;
  getSnapshot(): DataProviderSnapshot;
  getStore(): HydroVisionDataStore;
  isAvailable(): boolean;
}

export const DATA_STORE_KEYS: (keyof HydroVisionDataStore)[] = [
  "departamentos",
  "provincias",
  "distritos",
  "cuencas",
  "rios",
  "estaciones",
  "campanas",
  "muestras",
  "parametros",
  "clasificaciones",
  "indicesSatelitales",
  "usuarios",
  "reportes",
];
