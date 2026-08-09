/**
 * Parameter catalog repository — Sprint 3E
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { WATER_PARAMETER_CATALOG } from "@/lib/parameters/catalog";
import type { WaterParameterRecord } from "@/types/parameter-management";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { ApiError } from "@/server/api/errors";
import type { CreateParameterInput } from "@/server/validators/schemas/crud.schemas";

const ENTITY = "parameter";

type CatalogRow = {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  descripcion?: string;
  limiteEcaMin?: number;
  limiteEcaMax?: number;
};

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

function allRows(): CatalogRow[] {
  const base = seedFromCatalog().map((row) => overlay.get(row.id) ?? row);
  const extras = Array.from(overlay.values()).filter(
    (row) => !base.some((b) => b.id === row.id)
  );
  return filterActive(ENTITY, [...base, ...extras]);
}

export class ParameterRepository {
  findAll(): CatalogRow[] {
    return allRows();
  }

  findById(id: string): CatalogRow | null {
    return allRows().find((p) => p.id === id) ?? null;
  }

  findByCodigo(codigo: string): CatalogRow | null {
    return allRows().find((p) => p.codigo === codigo) ?? null;
  }

  create(input: CreateParameterInput): CatalogRow {
    if (allRows().some((p) => p.codigo === input.codigo)) {
      throw ApiError.duplicate("Ya existe un parámetro con ese código");
    }
    const row: CatalogRow = {
      id: `param-${Date.now()}`,
      ...input,
    };
    overlay.set(row.id, row);
    return row;
  }

  update(id: string, input: Partial<CreateParameterInput>): CatalogRow {
    const current = this.findById(id);
    if (!current) throw ApiError.notFound("Parámetro", id);
    const next = { ...current, ...input, id };
    overlay.set(id, next);
    return next;
  }

  softDelete(id: string): boolean {
    if (!this.findById(id)) return false;
    markSoftDeleted(ENTITY, id);
    return true;
  }

  toWaterParameterRecord(row: CatalogRow): WaterParameterRecord {
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
