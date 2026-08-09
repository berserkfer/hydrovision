import type { DataSourceType } from "@/types/data-provider";
import { dataSourceConfig } from "./data-source.config";

const VALID_SOURCES: DataSourceType[] = ["mock", "database"];

function parseStationsSource(raw: string | undefined): DataSourceType {
  if (raw && VALID_SOURCES.includes(raw as DataSourceType)) {
    return raw as DataSourceType;
  }
  return "mock";
}

function resolveStationsDataSource(): DataSourceType {
  const explicit =
    process.env.STATIONS_DATA_SOURCE ??
    process.env.NEXT_PUBLIC_STATIONS_DATA_SOURCE;

  if (explicit) {
    return parseStationsSource(explicit);
  }

  if (process.env.STATIONS_USE_DATABASE === "true") {
    return "database";
  }

  return dataSourceConfig.source === "database" ? "database" : "mock";
}

/** Origen de datos del módulo Estaciones — Sprint 3B */
export const stationsDataSourceConfig = {
  source: resolveStationsDataSource(),
} as const;

export function isStationsDatabaseEnabled(): boolean {
  return (
    stationsDataSourceConfig.source === "database" &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}
