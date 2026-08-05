import type { DataSourceType } from "@/types/data-provider";
import { MOCK_LAST_UPDATE } from "./app.config";

const VALID_SOURCES: DataSourceType[] = ["mock", "database", "gee", "api"];

function parseDataSource(raw: string | undefined): DataSourceType {
  if (raw && VALID_SOURCES.includes(raw as DataSourceType)) {
    return raw as DataSourceType;
  }
  return "mock";
}

function resolveDataSource(): DataSourceType {
  const explicit =
    process.env.NEXT_PUBLIC_DATA_SOURCE ??
    process.env.DATA_SOURCE;

  if (explicit) {
    return parseDataSource(explicit);
  }

  if (process.env.USE_DATABASE === "true") {
    return "database";
  }

  return "mock";
}

/** Configuración global del origen de datos */
export const dataSourceConfig = {
  /** Origen activo: mock | database | gee | api */
  source: resolveDataSource(),
  /** Versión del esquema de datos */
  schemaVersion: "5.1.0",
  lastUpdate: MOCK_LAST_UPDATE,
  /** Fallback seguro si un proveedor futuro no está disponible */
  fallbackSource: "mock" as DataSourceType,
} as const;

export function isDataSource(type: DataSourceType): boolean {
  return dataSourceConfig.source === type;
}
