/**
 * MeasurementService — Sprint 3E
 */

import type { ListQueryDto, PaginatedResultDto } from "@/server/dto/common.dto";
import {
  filterBySearch,
  paginateArray,
  sortArray,
} from "@/server/dto/common.dto";
import { auditService } from "@/server/audit/audit.service";
import { measurementRepository } from "@/server/repositories/measurement.repository";
import {
  createMeasurementSchema,
  parseBody,
  updateMeasurementSchema,
} from "@/server/validators/schemas/crud.schemas";
import { ApiError } from "@/server/api/errors";

export class MeasurementService {
  list(query: ListQueryDto): PaginatedResultDto<ReturnType<typeof measurementRepository.findAll>[number]> {
    let items = measurementRepository.findAll();
    items = filterBySearch(items, query.search, [
      "parametroNombre",
      "parametroCodigo",
      "laboratorio",
      "muestraId",
    ]);
    items = sortArray(items, query.sortBy ?? "fechaMedicion", query.sortOrder ?? "desc");
    return paginateArray(items, query);
  }

  getById(id: string) {
    const row = measurementRepository.findById(id);
    if (!row) throw ApiError.notFound("Medición", id);
    return row;
  }

  create(body: unknown) {
    const input = parseBody(createMeasurementSchema, body);
    const created = measurementRepository.create(input);
    void auditService.recordCreate("Measurement", created.id, created, `Medición ${created.parametroCodigo} creada`);
    void auditService.recordEnvironmentalAssessmentForStation(
      created.estacionId,
      "Evaluación ambiental recalculada tras nueva medición"
    );
    return created;
  }

  update(id: string, body: unknown) {
    const previous = measurementRepository.findById(id);
    const input = parseBody(updateMeasurementSchema, { ...(body as object), id });
    const updated = measurementRepository.update(id, input);
    void auditService.recordUpdate("Measurement", id, previous, updated, `Medición ${updated.parametroCodigo} actualizada`);
    void auditService.recordEnvironmentalAssessmentForStation(
      updated.estacionId,
      "Evaluación ambiental recalculada tras actualización de medición"
    );
    return updated;
  }

  remove(id: string) {
    const previous = measurementRepository.findById(id);
    const ok = measurementRepository.softDelete(id);
    if (!ok) throw ApiError.notFound("Medición", id);
    void auditService.recordDelete("Measurement", id, previous, `Medición ${id} eliminada (soft delete)`);
    if (previous?.estacionId) {
      void auditService.recordEnvironmentalAssessmentForStation(
        previous.estacionId,
        "Evaluación ambiental recalculada tras eliminación de medición"
      );
    }
    return { id, deleted: true as const };
  }
}

export const measurementService = new MeasurementService();
