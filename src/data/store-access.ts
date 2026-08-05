/**
 * Punto único de acceso al almacén de datos.
 * Toda la aplicación debe usar getDataStore() en lugar de importar mockDataStore directamente.
 */

import type { HydroVisionDataStore } from "@/models";
import { getDataProvider } from "@/providers";

export function getDataStore(): HydroVisionDataStore {
  return getDataProvider().getStore();
}

export { getDataProvider, setDataProvider, resetDataProvider } from "@/providers";
export { DataProviderFactory } from "@/providers/data-provider.factory";
