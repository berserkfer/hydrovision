/**
 * MockDataProvider — proveedor de datos simulados (única fuente mock centralizada).
 */

import { MOCK_LAST_UPDATE, appConfig } from "@/config";
import { mockDataStore } from "@/data/mock/store";
import type { IDataProvider, DataProviderMetadata } from "@/types/data-provider";
import { buildSnapshot } from "./provider.utils";

export class MockDataProvider implements IDataProvider {
  private readonly store = mockDataStore;

  getMetadata(): DataProviderMetadata {
    return {
      source: "mock",
      isSimulated: true,
      isConnected: true,
      version: appConfig.mockDataVersion,
      lastUpdate: MOCK_LAST_UPDATE,
      description: "Datos simulados desde mockDataStore unificado",
    };
  }

  getSnapshot() {
    return buildSnapshot(this.store, this.getMetadata());
  }

  getStore() {
    return this.store;
  }

  isAvailable(): boolean {
    return true;
  }
}

export const mockDataProvider = new MockDataProvider();
