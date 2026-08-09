/**
 * SampleService — Sprint 3E (Muestreos)
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
  list(
    query: ListQueryDto & { campanaId?: string }
  ): PaginatedResultDto<MuestraSummary> & { stats: SampleStats } {
    let items = sampleRepository.findAll(query.campanaId);
    items = filterBySearch(items, query.search, [
      "codigoMuestra",
      "campanaNombre",
      "estacionNombre",
      "responsableNombre",
    ]);
    items = sortArray(items, query.sortBy ?? "fechaMuestreo", query.sortOrder ?? "desc");
    return {
      ...paginateArray(items, query),
      stats: sampleRepository.getStats(query.campanaId),
    };
  }

  getById(id: string) {
    const detail = sampleRepository.findById(id);
    if (!detail) throw ApiError.notFound("Muestra", id);
    return detail;
  }

  create(body: unknown) {
    const input = parseBody(createSampleSchema, body) as CreateMuestraPayload;
    const result = sampleRepository.create(input);
    if (!result.success) throw ApiError.validation(result.message);
    return result;
  }

  update(id: string, body: unknown) {
    parseBody(updateSampleSchema, { ...(body as object), id });
    const result = sampleRepository.update(id, body as CreateMuestraPayload);
    if (!result.success) throw ApiError.validation(result.message);
    return result;
  }

  remove(id: string) {
    const removed = sampleRepository.softDelete(id);
    if (!removed) throw ApiError.notFound("Muestra", id);
    return { id, deleted: true as const };
  }
}

export const sampleService = new SampleService();
