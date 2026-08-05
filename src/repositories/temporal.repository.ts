/**
 * Repositorio mock — estaciones para análisis temporal.
 */

import { getDataStore } from "@/data/store-access";

export interface TemporalStationOption {
  id: string;
  code: string;
  name: string;
  riverId: string;
}

export function getTemporalStations(riverId = "rio-reque"): TemporalStationOption[] {
  return getDataStore().estaciones
    .filter((e) => e.rioId === riverId)
    .map((e) => ({
      id: e.id,
      code: e.codigo,
      name: e.nombre,
      riverId: e.rioId,
    }));
}

export function getTemporalStationName(stationId: string): string {
  const station = getDataStore().estaciones.find((e) => e.id === stationId);
  return station?.nombre ?? stationId;
}
