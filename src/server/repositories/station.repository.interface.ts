/**
 * Contrato del repositorio de Estaciones — Sprint 3C
 */

import type { StationFilterOptionsDto, StationSummaryDto } from "@/server/dto/station.dto";

export interface IStationRepository {
  getDataSource(): "database" | "mock";
  findAll(): Promise<StationSummaryDto[]>;
  findById(stationId: string): Promise<StationSummaryDto | null>;
  getFilterOptions(stations: StationSummaryDto[]): StationFilterOptionsDto;
}
