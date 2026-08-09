/**
 * StationRepository — acceso a datos (PostgreSQL / mock) — Sprint 3C
 */

import { isStationsDatabaseEnabled } from "@/config/stations-data-source.config";
import type { StationFilterOptionsDto, StationSummaryDto } from "@/server/dto/station.dto";
import { prisma } from "@/server/db";
import {
  buildFilterOptionsFromStations,
  mapStationRowToDto,
  type StationListRow,
} from "./station.mapper";
import type { IStationRepository } from "./station.repository.interface";
import {
  createMockStation,
  getMockStationById,
  getMockStations,
  mockStationCodigoExists,
  softDeleteMockStation,
  updateMockStation,
} from "@/lib/mock/stations";
import type { CreateStationInput } from "@/server/validators/schemas/crud.schemas";
import { ApiError } from "@/server/api/errors";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";

const STATION_ENTITY = "station";
import type { MonitoringStationRecord } from "@/types/station-management";

const stationListInclude = {
  rio: true,
  cuenca: true,
  department: true,
  _count: { select: { muestreos: true } },
  evaluacionesAmbiental: {
    orderBy: { evaluadoEn: "desc" as const },
    take: 1,
  },
  muestreos: {
    orderBy: { fechaMuestreo: "desc" as const },
    take: 1,
  },
} as const;

function mapMockRecord(record: MonitoringStationRecord): StationSummaryDto {
  return { ...record };
}

export class StationRepository implements IStationRepository {
  getDataSource(): "database" | "mock" {
    return isStationsDatabaseEnabled() ? "database" : "mock";
  }

  async findAll(): Promise<StationSummaryDto[]> {
    if (this.getDataSource() === "database") {
      const rows = await prisma.station.findMany({
        where: { estadoRegistro: "active" },
        orderBy: { codigo: "asc" },
        include: stationListInclude,
      });
      return filterActive(
        STATION_ENTITY,
        rows.map((row: StationListRow) => mapStationRowToDto(row, false))
      );
    }

    return getMockStations().map(mapMockRecord);
  }

  async findById(stationId: string): Promise<StationSummaryDto | null> {
    if (this.getDataSource() === "database") {
      const row = await prisma.station.findUnique({
        where: { id: stationId },
        include: stationListInclude,
      });
      if (!row) return null;
      return mapStationRowToDto(row as StationListRow, false);
    }

    const mock = getMockStationById(stationId);
    return mock ? mapMockRecord(mock) : null;
  }

  getFilterOptions(stations: StationSummaryDto[]): StationFilterOptionsDto {
    return buildFilterOptionsFromStations(stations);
  }

  async create(input: CreateStationInput): Promise<StationSummaryDto> {
    if (this.getDataSource() === "database") {
      const duplicate = await prisma.station.findFirst({
        where: { codigo: input.codigo, estadoRegistro: "active" },
      });
      if (duplicate) throw ApiError.duplicate("Ya existe una estación con ese código");

      const ref = await prisma.station.findFirst({
        where: { cuencaId: input.cuencaId, estadoRegistro: "active" },
      });
      if (!ref) {
        throw ApiError.validation("No hay estación de referencia en la cuenca seleccionada");
      }

      const id = `station-${Date.now()}`;
      const now = new Date();
      const row = await prisma.station.create({
        data: {
          id,
          codigo: input.codigo,
          nombre: input.nombre,
          cuencaId: input.cuencaId,
          rioId: input.rioId,
          departmentId: ref.departmentId,
          provinceId: ref.provinceId,
          districtId: ref.districtId,
          latitude: input.latitud,
          longitude: input.longitud,
          altitud: input.altitud,
          tramo: input.tramo,
          estado: input.estado ?? "active",
          descripcion: input.descripcion,
          entidadResponsable: input.entidadResponsable,
          fechaInstalacion: now,
          ultimaActualizacion: now,
        },
        include: stationListInclude,
      });
      return mapStationRowToDto(row as StationListRow, false);
    }

    if (mockStationCodigoExists(input.codigo)) {
      throw ApiError.duplicate("Ya existe una estación con ese código");
    }
    return mapMockRecord(createMockStation(input));
  }

  async update(id: string, input: Partial<CreateStationInput>): Promise<StationSummaryDto> {
    if (input.codigo) {
      const duplicate =
        this.getDataSource() === "database"
          ? await prisma.station.findFirst({
              where: { codigo: input.codigo, estadoRegistro: "active", NOT: { id } },
            })
          : mockStationCodigoExists(input.codigo, id);
      if (duplicate) throw ApiError.duplicate("Ya existe una estación con ese código");
    }

    if (this.getDataSource() === "database") {
      const existing = await prisma.station.findUnique({ where: { id } });
      if (!existing || existing.estadoRegistro !== "active") {
        throw ApiError.notFound("Estación", id);
      }

      const row = await prisma.station.update({
        where: { id },
        data: {
          codigo: input.codigo,
          nombre: input.nombre,
          cuencaId: input.cuencaId,
          rioId: input.rioId,
          latitude: input.latitud,
          longitude: input.longitud,
          altitud: input.altitud,
          tramo: input.tramo,
          estado: input.estado,
          descripcion: input.descripcion,
          entidadResponsable: input.entidadResponsable,
          ultimaActualizacion: new Date(),
        },
        include: stationListInclude,
      });
      return mapStationRowToDto(row as StationListRow, false);
    }

    const updated = updateMockStation(id, input);
    if (!updated) throw ApiError.notFound("Estación", id);
    return mapMockRecord(updated);
  }

  async softDelete(id: string): Promise<boolean> {
    if (this.getDataSource() === "database") {
      const existing = await prisma.station.findUnique({ where: { id } });
      if (!existing || existing.estadoRegistro !== "active") return false;
      await prisma.station.update({
        where: { id },
        data: { estadoRegistro: "inactive", ultimaActualizacion: new Date() },
      });
      markSoftDeleted(STATION_ENTITY, id);
      return true;
    }

    return softDeleteMockStation(id);
  }
}

export const stationRepository = new StationRepository();
