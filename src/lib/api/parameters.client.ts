/**
 * Cliente API — catálogo de Parámetros (Sprint 3E)
 */

import type { PaginatedResultDto } from "@/server/dto/common.dto";
import type { CreateParameterInput } from "@/server/validators/schemas/crud.schemas";
import type { WaterParameterRecord } from "@/types/parameter-management";
import {
  getMockParameterChartData,
  getMockParameterFilterOptions,
  getMockParameterRecords,
  getMockParameterSummaryStats,
} from "@/lib/mock/parameters";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type ParameterCatalogRow = {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  descripcion?: string;
  limiteEcaMin?: number;
  limiteEcaMax?: number;
};

export type ParameterListResponse = PaginatedResultDto<ParameterCatalogRow>;

export async function fetchParametersList(
  query?: Record<string, string | number | undefined>
): Promise<ParameterListResponse> {
  return apiGet<ParameterListResponse>("/api/parameters", { pageSize: 500, ...query });
}

export async function fetchParameterDetail(id: string): Promise<WaterParameterRecord> {
  return apiGet<WaterParameterRecord>(`/api/parameters/${encodeURIComponent(id)}`);
}

export async function createParameter(input: CreateParameterInput): Promise<ParameterCatalogRow> {
  return apiPost<ParameterCatalogRow>("/api/parameters", input);
}

export async function updateParameter(
  id: string,
  input: Partial<CreateParameterInput>
): Promise<ParameterCatalogRow> {
  return apiPut<ParameterCatalogRow>(`/api/parameters/${encodeURIComponent(id)}`, input);
}

export async function deleteParameter(id: string): Promise<{ id: string; deleted: true }> {
  return apiDelete(`/api/parameters/${encodeURIComponent(id)}`);
}

/** Datos enriquecidos del módulo (mediciones simuladas) */
export async function getAllParameterRecords(): Promise<WaterParameterRecord[]> {
  return getMockParameterRecords();
}

export async function getParameterSummaryStats() {
  return getMockParameterSummaryStats();
}

export async function getParameterChartData() {
  return getMockParameterChartData();
}

export async function getParameterFilterOptions() {
  return getMockParameterFilterOptions();
}
