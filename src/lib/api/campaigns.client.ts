/**
 * Cliente API — módulo Campañas (Sprint 3E)
 */

import type { PaginatedResultDto } from "@/server/dto/common.dto";
import type { CampanaDetail, CampanaSummary, CampaignStats, CreateCampanaInput } from "@/types/campaign";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type CampaignListResponse = PaginatedResultDto<CampanaSummary> & { stats: CampaignStats };

export async function fetchCampaignsList(
  query?: Record<string, string | number | undefined>
): Promise<CampaignListResponse> {
  return apiGet<CampaignListResponse>("/api/campaigns", { pageSize: 500, ...query });
}

export async function fetchCampaignDetail(id: string): Promise<CampanaDetail> {
  return apiGet<CampanaDetail>(`/api/campaigns/${encodeURIComponent(id)}`);
}

export async function createCampaign(input: CreateCampanaInput): Promise<CampanaSummary> {
  return apiPost<CampanaSummary>("/api/campaigns", input);
}

export async function updateCampaign(
  id: string,
  input: Partial<CreateCampanaInput>
): Promise<CampanaSummary> {
  return apiPut<CampanaSummary>(`/api/campaigns/${encodeURIComponent(id)}`, input);
}

export async function deleteCampaign(id: string): Promise<{ id: string; deleted: true }> {
  return apiDelete(`/api/campaigns/${encodeURIComponent(id)}`);
}

export async function getAllCampaignSummaries(): Promise<CampanaSummary[]> {
  const { items } = await fetchCampaignsList();
  return items;
}

export async function getCampaignStatsFromApi(): Promise<CampaignStats> {
  const { stats } = await fetchCampaignsList();
  return stats;
}
