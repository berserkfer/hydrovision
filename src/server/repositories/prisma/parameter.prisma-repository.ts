/**
 * ParameterPrismaRepository — catálogo persistente de parámetros
 */

import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { CreateParameterInput } from "@/server/validators/schemas/crud.schemas";
import { MOCK_LAST_UPDATE } from "@/config";
import type { WaterParameterRecord } from "@/types/parameter-management";
import { invalidateMonitoringDataStoreCache } from "@/server/lib/invalidate-data-store-cache";

const ECA_STANDARD_ID = "eca-agua-receptores-v1";
import {
  mapParameterToCatalogRow,
  type ParameterCatalogRow,
  type ParameterListRow,
} from "./monitoring.mappers";

const parameterInclude = {
  limites: {
    where: { ecaStandardId: ECA_STANDARD_ID },
    select: { limiteMin: true, limiteMax: true },
  },
} as const;

export class ParameterPrismaRepository {
  async findAll(): Promise<ParameterCatalogRow[]> {
    const rows = await prisma.parameter.findMany({
      where: { estado: "active" },
      orderBy: { nombre: "asc" },
      include: parameterInclude,
    });
    return rows.map((row) => mapParameterToCatalogRow(row as ParameterListRow));
  }

  async findById(id: string): Promise<ParameterCatalogRow | null> {
    const row = await prisma.parameter.findUnique({
      where: { id },
      include: parameterInclude,
    });
    if (!row || row.estado !== "active") return null;
    return mapParameterToCatalogRow(row as ParameterListRow);
  }

  async findByCodigo(codigo: string): Promise<ParameterCatalogRow | null> {
    const row = await prisma.parameter.findFirst({
      where: { codigo: codigo as never, estado: "active" },
      include: parameterInclude,
    });
    return row ? mapParameterToCatalogRow(row as ParameterListRow) : null;
  }

  async create(input: CreateParameterInput): Promise<ParameterCatalogRow> {
    const duplicate = await prisma.parameter.findFirst({
      where: { codigo: input.codigo as never },
    });
    if (duplicate) throw ApiError.duplicate("Ya existe un parámetro con ese código");

    const row = await prisma.parameter.create({
      data: {
        id: `param-${Date.now()}`,
        codigo: input.codigo as never,
        nombre: input.nombre,
        unidad: input.unidad,
        descripcion: input.descripcion,
        estado: "active",
      },
      include: parameterInclude,
    });

    await invalidateMonitoringDataStoreCache();
    return mapParameterToCatalogRow(row as ParameterListRow);
  }

  async update(id: string, input: Partial<CreateParameterInput>): Promise<ParameterCatalogRow> {
    const existing = await prisma.parameter.findUnique({ where: { id } });
    if (!existing || existing.estado !== "active") {
      throw ApiError.notFound("Parámetro", id);
    }

    const row = await prisma.parameter.update({
      where: { id },
      data: {
        nombre: input.nombre,
        unidad: input.unidad,
        descripcion: input.descripcion,
      },
      include: parameterInclude,
    });

    await invalidateMonitoringDataStoreCache();
    return mapParameterToCatalogRow(row as ParameterListRow);
  }

  async softDelete(id: string): Promise<boolean> {
    const existing = await prisma.parameter.findUnique({ where: { id } });
    if (!existing || existing.estado !== "active") return false;

    await prisma.parameter.update({
      where: { id },
      data: { estado: "inactive" },
    });

    await invalidateMonitoringDataStoreCache();
    return true;
  }

  toWaterParameterRecord(row: ParameterCatalogRow): WaterParameterRecord {
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
      isSimulated: false,
    };
  }
}

export const parameterPrismaRepository = new ParameterPrismaRepository();
