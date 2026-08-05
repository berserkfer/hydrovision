/**
 * FutureApiProvider — stub APIs externas REST/GraphQL (Fase 5+).
 */

import type { IDataProvider } from "@/types/data-provider";
import { createEmptyDataStore } from "./empty-data-store";
import { buildSnapshot, createFutureMetadata } from "./provider.utils";

export class FutureApiProvider implements IDataProvider {
  getMetadata() {
    return createFutureMetadata(
      "api",
      "Proveedor API externa — pendiente de configuración de endpoints (Fase 5+)"
    );
  }

  getSnapshot() {
    return buildSnapshot(createEmptyDataStore(), this.getMetadata());
  }

  getStore() {
    throw new Error(
      "[FutureApiProvider] API no conectada. Configure API_BASE_URL y DATA_SOURCE=api."
    );
  }

  isAvailable(): boolean {
    return false;
  }
}

export const futureApiProvider = new FutureApiProvider();
