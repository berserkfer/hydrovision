/**
 * SampleService — Sprint 3E (Muestreos) / unificación datos Prompt 1
 */

import { ApiError } from "@/server/api/errors";
import type { ListQueryDto, PaginatedResultDto } from "@/server/dto/common.dto";
import {
  filterBySearch,
  paginateArray,
  sortArray,
} from "@/server/dto/common.dto";
import { sampleRepository } from "@/server/repositories/sample.repository";
import {
  createSampleSchema,
  parseBody,
  updateSampleSchema,
} from "@/server/validators/schemas/crud.schemas";
import type { CreateMuestraPayload, MuestraSummary, SampleStats } from "@/types/sampling";

export class SampleService {
  getDataSource(): "database" | "mock" {
    return sampleRepository.getDataSource();
  }

  async list(
    query: ListQueryDto & { campanaId?: string }
  ): Promise<PaginatedResultDto<MuestraSummary> & { stats: SampleStats }> {
    let items = await sampleRepository.findAll(query.campanaId);
    items = filterBySearch(items, query.search, [
      "codigoMuestra",
      "campanaNombre",
      "estacionNombre",
      "responsableNombre",
    ]);
    items = sortArray(items, query.sortBy ?? "fechaMuestreo", query.sortOrder ?? "desc");
    return {
      ...paginateArray(items, query),
      stats: await sampleRepository.getStats(query.campanaId),
    };
  }

  async getById(id: string) {
    const detail = await sampleRepository.findById(id);
    if (!detail) throw ApiError.notFound("Muestra", id);
    return detail;
  }

  async create(body: unknown) {
    const input = parseBody(createSampleSchema, body) as CreateMuestraPayload;
    const result = await sampleRepository.create(input);
    if (!result.success) throw ApiError.validation(result.message);
    return result;
  }

  async update(id: string, body: unknown) {
    parseBody(updateSampleSchema, { ...(body as object), id });
    const result = await sampleRepository.update(id, body as CreateMuestraPayload);
    if (!result.success) throw ApiError.validation(result.message);
    return result;
  }

  async remove(id: string) {
    const removed = await sampleRepository.softDelete(id);
    if (!removed) throw ApiError.notFound("Muestra", id);
    return { id, deleted: true as const };
  }
}

export const sampleService = new SampleService();
