/**
 * Repositorio mock — Monitoreo y dashboard.
 */

import { MOCK_LAST_UPDATE, SIMULATION_DISCLAIMER } from "@/constants";
import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
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
  const store = getDataStore();
  const latestMuestra = store.muestras
    .map((m) => m.fechaMuestreo)
    .sort((a, b) => b.localeCompare(a))[0];

  return {
    totalStations: summaries.length,
    compliantCount: summaries.filter((s) => s.compliance.status === "compliant").length,
    alertCount: summaries.filter((s) => s.compliance.status === "alert").length,
    nonCompliantCount: summaries.filter((s) => s.compliance.status === "non_compliant").length,
    lastUpdate: latestMuestra ?? MOCK_LAST_UPDATE,
    isSimulated: !isMonitoringDatabaseEnabled(),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Serie temporal agregada desde muestreos reales del data store (mock o PostgreSQL). */
export function getAggregatedTimeSeries(): TimeSeriesPoint[] {
  const store = getDataStore();
  const byMonth = new Map<
    string,
    { ph: number[]; turbidez: number[]; oxigenoDisuelto: number[] }
  >();

  for (const muestra of store.muestras) {
    const parametros = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!parametros) continue;

    const month = muestra.fechaMuestreo.slice(0, 7);
    const bucket = byMonth.get(month) ?? { ph: [], turbidez: [], oxigenoDisuelto: [] };

    if (parametros.ph !== undefined && parametros.ph > 0) bucket.ph.push(parametros.ph);
    if (parametros.turbidez !== undefined && parametros.turbidez > 0)
      bucket.turbidez.push(parametros.turbidez);
    if (parametros.oxigenoDisuelto !== undefined && parametros.oxigenoDisuelto > 0)
      bucket.oxigenoDisuelto.push(parametros.oxigenoDisuelto);

    byMonth.set(month, bucket);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      ph: Number(average(values.ph).toFixed(2)),
      turbidity: Number(average(values.turbidez).toFixed(1)),
      dissolvedOxygen: Number(average(values.oxigenoDisuelto).toFixed(2)),
    }));
}

export function getMuestrasByEstacion(estacionId: string) {
  return getDataStore().muestras.filter((m) => m.estacionId === estacionId);
}

export function getClasificacionByMuestra(muestraId: string) {
  return getDataStore().clasificaciones.find((c) => c.muestraId === muestraId) ?? null;
}
