/**
 * Repositorio mock — Monitoreo y dashboard.
 */

import { MOCK_LAST_UPDATE, SIMULATION_DISCLAIMER } from "@/constants";
import { getDataStore } from "@/data/store-access";
import {
  buildLegacyStationSummary,
  estacionToMonitoringStation,
  indicesToLegacy,
  parametrosToFieldMeasurement,
} from "@/lib/adapters/legacy-adapter";
import { getCampanasByRio, getMuestrasByCampana } from "@/repositories/campaign.repository";
import type {
  DashboardStats,
  FieldMeasurement,
  MonitoringStation,
  SatelliteIndices,
  StationSummary,
  TimeSeriesPoint,
} from "@/types";

export { SIMULATION_DISCLAIMER };
export { getCampanasByRio, getMuestrasByCampana };

const requeEstaciones = () =>
  getDataStore().estaciones.filter((e) => e.rioId === "rio-reque");

export const monitoringStations: MonitoringStation[] = requeEstaciones().map(
  estacionToMonitoringStation
);

export const fieldMeasurements: FieldMeasurement[] = requeEstaciones().map((estacion) => {
  const store = getDataStore();
  const params = store.parametros.find((p) => p.estacionId === estacion.id)!;
  const muestra = store.muestras.find((m) => m.estacionId === estacion.id)!;
  return parametrosToFieldMeasurement(params, muestra.fechaMuestreo);
});

export const satelliteIndices: SatelliteIndices[] = requeEstaciones().map((estacion) => {
  const indices = getDataStore().indicesSatelitales.find((i) => i.estacionId === estacion.id)!;
  return indicesToLegacy(indices);
});

export function getStationSummaries(): StationSummary[] {
  return requeEstaciones().map(buildLegacyStationSummary);
}

export function getDashboardStats(): DashboardStats {
  const summaries = getStationSummaries();
  return {
    totalStations: summaries.length,
    compliantCount: summaries.filter((s) => s.compliance.status === "compliant").length,
    alertCount: summaries.filter((s) => s.compliance.status === "alert").length,
    nonCompliantCount: summaries.filter((s) => s.compliance.status === "non_compliant").length,
    lastUpdate: MOCK_LAST_UPDATE,
    isSimulated: true,
  };
}

export function getAggregatedTimeSeries(): TimeSeriesPoint[] {
  const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"];
  return months.map((date, i) => ({
    date,
    dissolvedOxygen: Number((5.8 - i * 0.15 + (i % 2) * 0.3).toFixed(2)),
    turbidity: Number((18 + i * 2.5).toFixed(1)),
    ph: Number((7.2 + (i % 3) * 0.1).toFixed(2)),
  }));
}

export function getMuestrasByEstacion(estacionId: string) {
  return getDataStore().muestras.filter((m) => m.estacionId === estacionId);
}

export function getClasificacionByMuestra(muestraId: string) {
  return getDataStore().clasificaciones.find((c) => c.muestraId === muestraId) ?? null;
}
