/**
 * Origen de datos del dominio de monitoreo — unificación Prompt 1
 * Estaciones, campañas, muestreos, parámetros y mediciones comparten DATA_SOURCE.
 */

import { dataSourceConfig } from "./data-source.config";

export function isMonitoringDatabaseEnabled(): boolean {
  return (
    dataSourceConfig.source === "database" &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}

export function getMonitoringDataSource(): "database" | "mock" {
  return isMonitoringDatabaseEnabled() ? "database" : "mock";
}

/** Origen de datos del dominio de monitoreo — unificación Prompt 1/2 */
export const monitoringDataSourceConfig = {
  /** Igual que DATA_SOURCE cuando es database y hay DATABASE_URL */
  source: getMonitoringDataSource(),
} as const;
