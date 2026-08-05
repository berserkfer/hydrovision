/**
 * Mock IndexRepository — Sprint 4 (sin GEE)
 */

import { getDataStore } from "@/data/store-access";
import { INDEX_DEFINITIONS } from "../config/index-definitions";
import type { IndexRepository } from "../interfaces/index-repository.interface";
import type { IndexCode } from "../types/index-engine.types";

function hashOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (hash % 100) / 1000;
}

export class MockIndexRepository implements IndexRepository {
  getStoredValue(stationId: string, code: IndexCode): number | null {
    const record = getDataStore().indicesSatelitales.find((item) => item.estacionId === stationId);
    if (!record) return null;

    switch (code) {
      case "NDWI":
        return record.ndwi;
      case "NDVI":
        return record.ndvi;
      case "MNDWI":
        return record.mndwi;
      case "NDTI":
        return record.ndti;
      case "NDMI":
        return Number(((record.ndvi + record.ndwi) / 2 - 0.05).toFixed(4));
      default:
        return null;
    }
  }

  getPreviousValue(stationId: string, code: IndexCode, currentValue: number): number {
    const offset = hashOffset(`${stationId}-${code}`) + 0.04;
    const direction = code === "NDTI" ? 1 : -1;
    return Number((currentValue + direction * offset).toFixed(4));
  }

  getBandReflectance(stationId: string): Record<string, number> {
    const ndvi = this.getStoredValue(stationId, "NDVI") ?? 0.35;
    const ndwi = this.getStoredValue(stationId, "NDWI") ?? 0.12;

    return {
      red: Number((0.08 + ndvi * 0.05).toFixed(4)),
      green: Number((0.12 + ndwi * 0.04).toFixed(4)),
      nir: Number((0.28 + ndvi * 0.25).toFixed(4)),
      swir: Number((0.1 + (1 - ndmiProxy(ndvi, ndwi)) * 0.08).toFixed(4)),
    };
  }

  getStationIdsForRiver(riverId: string): string[] {
    return getDataStore()
      .estaciones.filter((station) => station.rioId === riverId)
      .map((station) => station.id);
  }
}

function ndmiProxy(ndvi: number, ndwi: number): number {
  return (ndvi + ndwi) / 2;
}

export const mockIndexRepository = new MockIndexRepository();

export function getIndexDefinition(code: IndexCode) {
  return INDEX_DEFINITIONS[code];
}
