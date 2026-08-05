/**
 * Repositorio de estaciones de monitoreo — Sprint 2C
 */

import { getMockCampaignsByStation } from "@/lib/mock/campaigns";
import {
  getMockEcaDetailByStation,
  getMockMeasurementsByStation,
  getMockSatelliteIndicesByStation,
} from "@/lib/mock/measurements";
import {
  getMockStationById,
  getMockStationFilterOptions,
  getMockStations,
} from "@/lib/mock/stations";
import type {
  MonitoringStationRecord,
  StationDetailRecord,
  StationStats,
} from "@/types/station-management";

export function getAllStationRecords(): MonitoringStationRecord[] {
  return getMockStations();
}

export function getStationRecordById(stationId: string): MonitoringStationRecord | null {
  return getMockStationById(stationId);
}

export function getStationDetailRecord(stationId: string): StationDetailRecord | null {
  const station = getMockStationById(stationId);
  if (!station) return null;

  const eca = getMockEcaDetailByStation(stationId);

  return {
    station,
    campanas: getMockCampaignsByStation(stationId),
    mediciones: getMockMeasurementsByStation(stationId),
    indicesSatelitales: getMockSatelliteIndicesByStation(stationId),
    parametrosViolados: eca.parametrosViolados,
    parametrosEnAlerta: eca.parametrosEnAlerta,
  };
}

export function getStationStats(): StationStats {
  const stations = getMockStations();
  return {
    total: stations.length,
    activas: stations.filter((s) => s.estado === "active").length,
    inactivas: stations.filter((s) => s.estado === "offline").length,
    mantenimiento: stations.filter((s) => s.estado === "maintenance").length,
  };
}

export { getMockStationFilterOptions as getStationFilterOptions };
