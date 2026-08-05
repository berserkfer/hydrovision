/**
 * Registro singleton del proveedor de datos activo (Dependency Injection).
 */

import type { IDataProvider } from "@/types/data-provider";
import { DataProviderFactory } from "./data-provider.factory";

export { MockDataProvider, mockDataProvider } from "./mock-data.provider";
export {
  FutureEarthEngineProvider,
  futureEarthEngineProvider,
} from "./future-earth-engine.provider";
export { FutureApiProvider, futureApiProvider } from "./future-api.provider";
export { DataProviderFactory } from "./data-provider.factory";
export { createEmptyDataStore } from "./empty-data-store";
export { buildSnapshot, createFutureMetadata } from "./provider.utils";

let activeProvider: IDataProvider | null = null;

/** Obtiene el proveedor de datos activo (singleton) */
export function getDataProvider(): IDataProvider {
  if (!activeProvider) {
    activeProvider = DataProviderFactory.createWithFallback();
  }
  return activeProvider;
}

/** Inyecta un proveedor (tests o configuración avanzada) */
export function setDataProvider(provider: IDataProvider): void {
  activeProvider = provider;
}

/** Reinicia el singleton (tests) */
export function resetDataProvider(): void {
  activeProvider = null;
}
