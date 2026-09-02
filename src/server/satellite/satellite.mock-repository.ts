/**
 * SatelliteMockRepository — datos desde mockDataStore (explícitamente simulados).
 */

import { getDataStore } from "@/data/store-access";
import type { SatelliteQueryFilters } from "./satellite.types";
import type { SatelliteRepository } from "./satellite.repository";
import { mapMockIndicesToObservation, mapObservationToScene } from "./satellite.mappers";

function applyFilters(
  items: ReturnType<typeof mapMockIndicesToObservation>[],
  filters?: SatelliteQueryFilters
) {
  let result = items;
  if (filters?.stationId) {
    result = result.filter((o) => o.stationId === filters.stationId);
  }
  if (filters?.fechaInicio) {
    result = result.filter((o) => o.acquisitionDate >= filters.fechaInicio!);
  }
  if (filters?.fechaFin) {
    result = result.filter((o) => o.acquisitionDate <= filters.fechaFin!);
  }
  return result.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate));
}

export class SatelliteMockRepository implements SatelliteRepository {
  getDataSource(): "mock" {
    return "mock";
  }

  async findObservations(filters?: SatelliteQueryFilters) {
    const rows = getDataStore().indicesSatelitales.map(mapMockIndicesToObservation);
    return applyFilters(rows, filters);
  }

  async findObservationById(id: string) {
    const row = getDataStore().indicesSatelitales.find((i) => i.id === id);
    return row ? mapMockIndicesToObservation(row) : null;
  }

  async findScenes(filters?: SatelliteQueryFilters) {
    const observations = await this.findObservations(filters);
    return observations.map(mapObservationToScene);
  }
}

export const satelliteMockRepository = new SatelliteMockRepository();
