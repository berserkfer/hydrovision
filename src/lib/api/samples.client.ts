/**
 * Cliente API — módulo Muestreos (Sprint 3E)
 */

import type { PaginatedResultDto } from "@/server/dto/common.dto";
import type {
  CreateMuestraPayload,
  MuestraDetail,
  MuestraSummary,
  SampleStats,
} from "@/types/sampling";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type SampleListResponse = PaginatedResultDto<MuestraSummary> & { stats: SampleStats };

export async function fetchSamplesList(
  query?: Record<string, string | number | undefined>
): Promise<SampleListResponse> {
  return apiGet<SampleListResponse>("/api/samples", { pageSize: 500, ...query });
}

export async function fetchSampleDetail(id: string): Promise<MuestraDetail> {
  return apiGet<MuestraDetail>(`/api/samples/${encodeURIComponent(id)}`);
}

export async function createSample(payload: CreateMuestraPayload) {
  return apiPost<{ success: boolean; message: string; sample?: MuestraSummary }>(
    "/api/samples",
    payload
  );
}

export async function updateSample(id: string, payload: CreateMuestraPayload) {
  return apiPut<{ success: boolean; message: string; sample?: MuestraSummary }>(
    `/api/samples/${encodeURIComponent(id)}`,
    payload
  );
}

export async function deleteSample(id: string): Promise<{ id: string; deleted: true }> {
  return apiDelete(`/api/samples/${encodeURIComponent(id)}`);
}

export async function getAllSampleSummaries(campanaId?: string): Promise<MuestraSummary[]> {
  const { items } = await fetchSamplesList(
    campanaId ? { campanaId, pageSize: 500 } : { pageSize: 500 }
  );
  return items;
}

export async function getSampleStatsFromApi(campanaId?: string): Promise<SampleStats> {
  const { stats } = await fetchSamplesList(
    campanaId ? { campanaId, pageSize: 500 } : { pageSize: 500 }
  );
  return stats;
}
