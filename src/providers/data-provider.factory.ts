/**
 * DataProviderFactory — selección del origen de datos (Factory Pattern).
 */

import { dataSourceConfig } from "@/config/data-source.config";
import type { IDataProvider, DataSourceType } from "@/types/data-provider";
import { futureApiProvider } from "./future-api.provider";
import { futureEarthEngineProvider } from "./future-earth-engine.provider";
import { mockDataProvider } from "./mock-data.provider";

let lazyDatabaseProvider: IDataProvider | null = null;

function getDatabaseProvider(): IDataProvider {
  if (!lazyDatabaseProvider) {
    // Carga diferida — evita @prisma/client en modo mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import síncrono diferido
    const { databaseDataProvider } = require("./database-data.provider") as typeof import("./database-data.provider");
    lazyDatabaseProvider = databaseDataProvider;
  }
  return lazyDatabaseProvider;
}

export class DataProviderFactory {
  static create(source: DataSourceType = dataSourceConfig.source): IDataProvider {
    switch (source) {
      case "database":
        return getDatabaseProvider();
      case "gee":
        return futureEarthEngineProvider;
      case "api":
        return futureApiProvider;
      case "mock":
      default:
        return mockDataProvider;
    }
  }

  static createWithFallback(source: DataSourceType = dataSourceConfig.source): IDataProvider {
    const provider = this.create(source);
    if (provider.isAvailable()) {
      return provider;
    }

    if (source !== dataSourceConfig.fallbackSource) {
      console.warn(
        `[DataProviderFactory] Proveedor "${source}" no disponible. Fallback → "${dataSourceConfig.fallbackSource}".`
      );
      return this.create(dataSourceConfig.fallbackSource);
    }

    return provider;
  }

  static getRegisteredSources(): DataSourceType[] {
    return ["mock", "database", "gee", "api"];
  }
}
