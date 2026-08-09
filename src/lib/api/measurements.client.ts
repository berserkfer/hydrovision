/**
 * Cliente API — Mediciones (Sprint 3E)
 */

import type { PaginatedResultDto } from "@/server/dto/common.dto";
import type { CreateMeasurementInput } from "@/server/validators/schemas/crud.schemas";
import type { MeasurementRow } from "@/server/repositories/measurement.repository";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type MeasurementListResponse = PaginatedResultDto<MeasurementRow>;

export async function fetchMeasurementsList(
  query?: Record<string, string | number | undefined>
): Promise<MeasurementListResponse> {
  return apiGet<MeasurementListResponse>("/api/measurements", { pageSize: 500, ...query });
}

export async function fetchMeasurementDetail(id: string): Promise<MeasurementRow> {
  return apiGet<MeasurementRow>(`/api/measurements/${encodeURIComponent(id)}`);
}

export async function createMeasurement(input: CreateMeasurementInput): Promise<MeasurementRow> {
  return apiPost<MeasurementRow>("/api/measurements", input);
}

export async function updateMeasurement(
  id: string,
  input: Partial<CreateMeasurementInput>
): Promise<MeasurementRow> {
  return apiPut<MeasurementRow>(`/api/measurements/${encodeURIComponent(id)}`, input);
}

export async function deleteMeasurement(id: string): Promise<{ id: string; deleted: true }> {
  return apiDelete(`/api/measurements/${encodeURIComponent(id)}`);
}
