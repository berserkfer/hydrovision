/**
 * CampaignService — Sprint 3E
 */

import { ApiError } from "@/server/api/errors";
import type { ListQueryDto, PaginatedResultDto } from "@/server/dto/common.dto";
import {
  filterBySearch,
  paginateArray,
  sortArray,
} from "@/server/dto/common.dto";
import {
  createCampaignSchema,
  parseBody,
  updateCampaignSchema,
} from "@/server/validators/schemas/crud.schemas";
import { auditService } from "@/server/audit/audit.service";
import { campaignRepository } from "@/server/repositories/campaign.repository";
import type { CampanaSummary, CampaignStats, CreateCampanaInput } from "@/types/campaign";

export class CampaignService {
  list(query: ListQueryDto): PaginatedResultDto<CampanaSummary> & { stats: CampaignStats } {
    let items = campaignRepository.findAll();
    items = filterBySearch(items, query.search, [
      "nombre",
      "codigo",
      "responsableNombre",
      "rioNombre",
      "cuencaNombre",
    ]);
    items = sortArray(items, query.sortBy ?? "fechaInicio", query.sortOrder ?? "desc");
    const page = paginateArray(items, query);
    return { ...page, stats: campaignRepository.getStats() };
  }

  getById(id: string) {
    const detail = campaignRepository.findDetailById(id);
    if (!detail) throw ApiError.notFound("Campaña", id);
    return detail;
  }

  create(body: unknown) {
    const parsed = parseBody(createCampaignSchema, body);
    const input: CreateCampanaInput = {
      nombre: parsed.nombre,
      responsableId: parsed.responsableId,
      fecha: parsed.fecha,
      cuencaId: parsed.cuencaId,
      rioId: parsed.rioId,
      objetivo: parsed.objetivo,
      descripcion: parsed.descripcion ?? "",
      estacionIds: parsed.estacionIds ?? [],
      observaciones: parsed.observaciones ?? "",
    };
    const created = campaignRepository.create(input);
    void auditService.recordCreate("Campaign", created.id, created, `Campaña ${created.codigo} creada`);
    return created;
  }

  update(id: string, body: unknown) {
    const previous = campaignRepository.findDetailById(id);
    const input = parseBody(updateCampaignSchema, { ...(body as object), id });
    const updated = campaignRepository.update(id, input as Parameters<typeof campaignRepository.update>[1]);
    if (!updated) throw ApiError.notFound("Campaña", id);
    void auditService.recordUpdate("Campaign", id, previous, updated, `Campaña ${updated.codigo} actualizada`);
    return updated;
  }

  remove(id: string) {
    const previous = campaignRepository.findDetailById(id);
    const ok = campaignRepository.softDelete(id);
    if (!ok) throw ApiError.notFound("Campaña", id);
    void auditService.recordDelete(
      "Campaign",
      id,
      previous,
      `Campaña ${previous?.codigo ?? id} eliminada (soft delete)`
    );
    return { id, deleted: true as const };
  }
}

export const campaignService = new CampaignService();
