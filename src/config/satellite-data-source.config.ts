/**
 * Origen de datos de la capa satelital — alineado con DATA_SOURCE global.
 */

import {
  getMonitoringDataSource,
  isMonitoringDatabaseEnabled,
} from "./monitoring-data-source.config";

export function getSatelliteDataSource(): "database" | "mock" {
  return getMonitoringDataSource();
}

export function isSatelliteDatabaseEnabled(): boolean {
  return isMonitoringDatabaseEnabled();
}

export const satelliteDataSourceConfig = {
  source: getSatelliteDataSource(),
} as const;
