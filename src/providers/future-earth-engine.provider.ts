/**
 * FutureEarthEngineProvider — stub Google Earth Engine (Fase 4+).
 */

import type { IDataProvider } from "@/types/data-provider";
import { createEmptyDataStore } from "./empty-data-store";
import { buildSnapshot, createFutureMetadata } from "./provider.utils";

export class FutureEarthEngineProvider implements IDataProvider {
  getMetadata() {
    return createFutureMetadata(
      "gee",
      "Proveedor Google Earth Engine — pendiente de autenticación GEE (Fase 4+)"
    );
  }

  getSnapshot() {
    return buildSnapshot(createEmptyDataStore(), this.getMetadata());
  }

  getStore(): never {
    throw new Error(
      "[FutureEarthEngineProvider] GEE no conectado. Configure GEE_PROJECT_ID y DATA_SOURCE=gee."
    );
  }

  isAvailable(): boolean {
    return false;
  }
}

export const futureEarthEngineProvider = new FutureEarthEngineProvider();
