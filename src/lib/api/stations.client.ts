/**
 * Cliente API — módulo Estaciones (Sprint 3C)
 */

import type {
  StationDetailResponseDto,
  StationListResponseDto,
  StationSummaryDto,
} from "@/server/dto/station.dto";
import type { CreateStationInput } from "@/server/validators/schemas/crud.schemas";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import type {
  MonitoringStationRecord,
  StationDetailRecord,
  StationStats,
} from "@/types/station-management";

export async function fetchStationsList(
  query?: Record<string, string | number | undefined>
): Promise<StationListResponseDto> {
  return apiGet<StationListResponseDto>("/api/stations", query);
}

export async function createStation(input: CreateStationInput): Promise<StationSummaryDto> {
  return apiPost<StationSummaryDto>("/api/stations", input);
}

export async function updateStation(
  id: string,
  input: Partial<CreateStationInput>
): Promise<StationSummaryDto> {
  return apiPut<StationSummaryDto>(`/api/stations/${encodeURIComponent(id)}`, input);
}

export async function deleteStation(id: string): Promise<{ id: string; deleted: true }> {
  return apiDelete(`/api/stations/${encodeURIComponent(id)}`);
}

export async function fetchStationDetail(
  stationId: string
): Promise<StationDetailResponseDto> {
  return apiGet<StationDetailResponseDto>(`/api/stations/${encodeURIComponent(stationId)}`);
}

/** Adaptadores para componentes UI existentes (sin cambios visuales) */
export async function getAllStationRecords(): Promise<MonitoringStationRecord[]> {
  const { stations } = await fetchStationsList();
  return stations;
}

export async function getStationStats(): Promise<StationStats> {
  const { stats } = await fetchStationsList();
  return stats;
}

export async function getStationFilterOptions() {
  const { filterOptions } = await fetchStationsList();
  return filterOptions;
}

export async function getStationDetailRecord(
  stationId: string
): Promise<StationDetailRecord | null> {
  try {
    return await fetchStationDetail(stationId);
  } catch {
    return null;
  }
}

export async function getStationRecordById(
  stationId: string
): Promise<MonitoringStationRecord | null> {
  try {
    const detail = await fetchStationDetail(stationId);
    return detail.station;
  } catch {
    return null;
  }
}
