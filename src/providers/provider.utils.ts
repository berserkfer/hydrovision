/**
 * Utilidades compartidas para proveedores de datos.
 */

import type {
  DataProviderMetadata,
  DataProviderSnapshot,
  DataSourceType,
} from "@/types/data-provider";
import { DATA_STORE_KEYS } from "@/types/data-provider";
import type { HydroVisionDataStore } from "@/models";

export function buildSnapshot(
  store: HydroVisionDataStore,
  metadata: DataProviderMetadata
): DataProviderSnapshot {
  const counts = DATA_STORE_KEYS.reduce(
    (acc, key) => {
      const value = store[key];
      acc[key] = Array.isArray(value) ? value.length : 0;
      return acc;
    },
    {} as Partial<Record<keyof HydroVisionDataStore, number>>
  );

  return {
    metadata,
    storeKeys: [...DATA_STORE_KEYS],
    counts,
  };
}

export function createFutureMetadata(
  source: DataSourceType,
  description: string
): DataProviderMetadata {
  return {
    source,
    isSimulated: false,
    isConnected: false,
    version: "0.0.0-stub",
    lastUpdate: new Date().toISOString(),
    description,
  };
}
