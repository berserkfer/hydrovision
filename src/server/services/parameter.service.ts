/**
 * ParameterService — Sprint 3E / unificación datos Prompt 1
 */

import type { ListQueryDto } from "@/server/dto/common.dto";
import {
  filterBySearch,
  paginateArray,
  sortArray,
} from "@/server/dto/common.dto";
import { auditService } from "@/server/audit/audit.service";
import { parameterRepository } from "@/server/repositories/parameter.repository";
import {
  createParameterSchema,
  parseBody,
  updateParameterSchema,
} from "@/server/validators/schemas/crud.schemas";
import { ApiError } from "@/server/api/errors";

export class ParameterService {
  getDataSource(): "database" | "mock" {
    return parameterRepository.getDataSource();
  }

  async list(query: ListQueryDto) {
    let items = await parameterRepository.findAll();
    items = filterBySearch(items, query.search, ["nombre", "codigo", "unidad"]);
    items = sortArray(items, query.sortBy ?? "nombre", query.sortOrder ?? "asc");
    return paginateArray(items, query);
  }

  async getById(id: string) {
    const row = await parameterRepository.findById(id);
    if (!row) throw ApiError.notFound("Parámetro", id);
    return parameterRepository.toWaterParameterRecord(row);
  }

  async create(body: unknown) {
    const input = parseBody(createParameterSchema, body);
    const created = await parameterRepository.create(input);
    void auditService.recordCreate("Parameter", created.id, created, `Parámetro ${created.codigo} creado`);
    return created;
  }

  async update(id: string, body: unknown) {
    const previous = await parameterRepository.findById(id);
    const input = parseBody(updateParameterSchema, { ...(body as object), id });
    const updated = await parameterRepository.update(id, input);
    void auditService.recordUpdate("Parameter", id, previous, updated, `Parámetro ${updated.codigo} actualizado`);
    return updated;
  }

  async remove(id: string) {
    const previous = await parameterRepository.findById(id);
    const ok = await parameterRepository.softDelete(id);
    if (!ok) throw ApiError.notFound("Parámetro", id);
    void auditService.recordDelete(
      "Parameter",
      id,
      previous,
      `Parámetro ${previous?.codigo ?? id} eliminado (soft delete)`
    );
    return { id, deleted: true as const };
  }
}

export const parameterService = new ParameterService();
