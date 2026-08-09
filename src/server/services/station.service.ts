/**
 * StationService — lógica de negocio del módulo Estaciones — Sprint 3C
 */

import { ApiError } from "@/server/api/errors";
import type {
  StationDetailResponseDto,
  StationListResponseDto,
  StationStatsDto,
  StationSummaryDto,
} from "@/server/dto/station.dto";
import { auditService } from "@/server/audit/audit.service";
import { stationRepository } from "@/server/repositories/station.repository";
import { assertValidStationId } from "@/server/validators/station.validator";
import {
  createStationSchema,
  parseBody,
  updateStationSchema,
} from "@/server/validators/schemas/crud.schemas";
import type { ListQueryDto } from "@/server/dto/common.dto";
import { filterBySearch, sortArray } from "@/server/dto/common.dto";
import { getMockCampaignsByStation } from "@/lib/mock/campaigns";
import {
  getMockEcaDetailByStation,
  getMockMeasurementsByStation,
  getMockSatelliteIndicesByStation,
} from "@/lib/mock/measurements";

function computeStats(stations: StationSummaryDto[]): StationStatsDto {
  return {
    total: stations.length,
    activas: stations.filter((s) => s.estado === "active").length,
    inactivas: stations.filter((s) => s.estado === "offline").length,
    mantenimiento: stations.filter((s) => s.estado === "maintenance").length,
  };
}

export class StationService {
  getDataSource(): "database" | "mock" {
    return stationRepository.getDataSource();
  }

  async getList(query?: ListQueryDto): Promise<StationListResponseDto> {
    let stations = await stationRepository.findAll();
    if (query?.search) {
      stations = filterBySearch(stations, query.search, [
        "codigo",
        "nombre",
        "rioNombre",
        "cuencaNombre",
        "departamentoNombre",
        "tramo",
      ]);
    }
    if (query?.sortBy) {
      stations = sortArray(stations, query.sortBy, query.sortOrder ?? "asc");
    }
    return {
      stations,
      stats: computeStats(stations),
      filterOptions: stationRepository.getFilterOptions(stations),
    };
  }

  async create(body: unknown): Promise<StationSummaryDto> {
    const input = parseBody(createStationSchema, body);
    const created = await stationRepository.create(input);
    void auditService.recordCreate("Station", created.id, created, `Estación ${created.codigo} creada`);
    return created;
  }

  async update(id: string, body: unknown): Promise<StationSummaryDto> {
    const stationId = assertValidStationId(id);
    const previous = await stationRepository.findById(stationId);
    const input = parseBody(updateStationSchema, { ...(body as object), id: stationId });
    const updated = await stationRepository.update(stationId, input);
    void auditService.recordUpdate(
      "Station",
      stationId,
      previous,
      updated,
      `Estación ${updated.codigo} actualizada`
    );
    return updated;
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const stationId = assertValidStationId(id);
    const previous = await stationRepository.findById(stationId);
    const ok = await stationRepository.softDelete(stationId);
    if (!ok) throw ApiError.notFound("Estación", stationId);
    void auditService.recordDelete(
      "Station",
      stationId,
      previous,
      `Estación ${previous?.codigo ?? stationId} eliminada (soft delete)`
    );
    return { id: stationId, deleted: true };
  }

  async getById(rawId: string): Promise<StationDetailResponseDto> {
    const stationId = assertValidStationId(rawId);
    const station = await stationRepository.findById(stationId);

    if (!station) {
      throw ApiError.notFound("Estación", stationId);
    }

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
}

export const stationService = new StationService();
