/**
 * CampaignService — Sprint 3E / unificación datos Prompt 1
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
  getDataSource(): "database" | "mock" {
    return campaignRepository.getDataSource();
  }

  async list(
    query: ListQueryDto
  ): Promise<PaginatedResultDto<CampanaSummary> & { stats: CampaignStats }> {
    let items = await campaignRepository.findAll();
    items = filterBySearch(items, query.search, [
      "nombre",
      "codigo",
      "responsableNombre",
      "rioNombre",
      "cuencaNombre",
    ]);
    items = sortArray(items, query.sortBy ?? "fechaInicio", query.sortOrder ?? "desc");
    const page = paginateArray(items, query);
    return { ...page, stats: await campaignRepository.getStats() };
  }

  async getById(id: string) {
    const detail = await campaignRepository.findDetailById(id);
    if (!detail) throw ApiError.notFound("Campaña", id);
    return detail;
  }

  async create(body: unknown) {
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
    const created = await campaignRepository.create(input);
    void auditService.recordCreate("Campaign", created.id, created, `Campaña ${created.codigo} creada`);
    return created;
  }

  async update(id: string, body: unknown) {
    const previous = await campaignRepository.findDetailById(id);
    const input = parseBody(updateCampaignSchema, { ...(body as object), id });
    const updated = await campaignRepository.update(
      id,
      input as Parameters<typeof campaignRepository.update>[1]
    );
    if (!updated) throw ApiError.notFound("Campaña", id);
    void auditService.recordUpdate("Campaign", id, previous, updated, `Campaña ${updated.codigo} actualizada`);
    return updated;
  }

  async remove(id: string) {
    const previous = await campaignRepository.findDetailById(id);
    const ok = await campaignRepository.softDelete(id);
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
