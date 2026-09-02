/**
 * Parameter catalog repository — mock overlay + Prisma catálogo persistente
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { getMonitoringDataSource } from "@/config/monitoring-data-source.config";
import { WATER_PARAMETER_CATALOG } from "@/lib/parameters/catalog";
import type { WaterParameterRecord } from "@/types/parameter-management";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { ApiError } from "@/server/api/errors";
import type { CreateParameterInput } from "@/server/validators/schemas/crud.schemas";
import {
  parameterPrismaRepository,
} from "./prisma/parameter.prisma-repository";
import type { ParameterCatalogRow } from "./prisma/monitoring.mappers";

const ENTITY = "parameter";

type CatalogRow = ParameterCatalogRow;

const overlay = new Map<string, CatalogRow>();

function seedFromCatalog(): CatalogRow[] {
  return WATER_PARAMETER_CATALOG.map((p) => ({
    id: p.code,
    codigo: p.code,
    nombre: p.name,
    unidad: p.unit,
    descripcion: p.description,
    limiteEcaMin: p.ecaMin,
    limiteEcaMax: p.ecaMax,
  }));
}

function allMockRows(): CatalogRow[] {
  const base = seedFromCatalog().map((row) => overlay.get(row.id) ?? row);
  const extras = Array.from(overlay.values()).filter(
    (row) => !base.some((b) => b.id === row.id)
  );
  return filterActive(ENTITY, [...base, ...extras]);
}

export class ParameterRepository {
  getDataSource(): "database" | "mock" {
    return getMonitoringDataSource();
  }

  async findAll(): Promise<CatalogRow[]> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.findAll();
    }
    return allMockRows();
  }

  async findById(id: string): Promise<CatalogRow | null> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.findById(id);
    }
    return allMockRows().find((p) => p.id === id) ?? null;
  }

  async findByCodigo(codigo: string): Promise<CatalogRow | null> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.findByCodigo(codigo);
    }
    return allMockRows().find((p) => p.codigo === codigo) ?? null;
  }

  async create(input: CreateParameterInput): Promise<CatalogRow> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.create(input);
    }
    if ((await this.findAll()).some((p) => p.codigo === input.codigo)) {
      throw ApiError.duplicate("Ya existe un parámetro con ese código");
    }
    const row: CatalogRow = {
      id: `param-${Date.now()}`,
      ...input,
    };
    overlay.set(row.id, row);
    return row;
  }

  async update(id: string, input: Partial<CreateParameterInput>): Promise<CatalogRow> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.update(id, input);
    }
    const current = await this.findById(id);
    if (!current) throw ApiError.notFound("Parámetro", id);
    const next = { ...current, ...input, id };
    overlay.set(id, next);
    return next;
  }

  async softDelete(id: string): Promise<boolean> {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.softDelete(id);
    }
    if (!(await this.findById(id))) return false;
    markSoftDeleted(ENTITY, id);
    return true;
  }

  toWaterParameterRecord(row: CatalogRow): WaterParameterRecord {
    if (this.getDataSource() === "database") {
      return parameterPrismaRepository.toWaterParameterRecord(row);
    }
    return {
      id: row.id,
      parameterCode: row.codigo as WaterParameterRecord["parameterCode"],
      parameterName: row.nombre,
      category: "physical",
      unit: row.unidad,
      value: 0,
      ecaLimit: row.limiteEcaMax != null ? `≤ ${row.limiteEcaMax}` : "—",
      status: "compliant",
      trend: "stable",
      fecha: MOCK_LAST_UPDATE.slice(0, 10),
      estacionId: "",
      estacionCodigo: "—",
      estacionNombre: "—",
      campanaId: "",
      campanaCodigo: "—",
      campanaNombre: "—",
      isSimulated: true,
    };
  }
}

export const parameterRepository = new ParameterRepository();
