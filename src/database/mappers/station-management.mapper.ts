/**
 * @deprecated Usar `@/server/repositories/station.mapper`
 */
import {
  mapStationRowToDto,
  buildFilterOptionsFromStations,
  type StationListRow,
} from "@/server/repositories/station.mapper";
import type { MonitoringStationRecord } from "@/types/station-management";

export type { StationListRow };

export function mapStationRowToMonitoringRecord(
  row: StationListRow,
  isSimulated = false
): MonitoringStationRecord {
  return mapStationRowToDto(row, isSimulated);
}

export function buildStationFilterOptions(stations: MonitoringStationRecord[]) {
  return buildFilterOptionsFromStations(stations);
}
