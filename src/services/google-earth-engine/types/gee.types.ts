/**
 * Tipos del módulo Google Earth Engine — Sprint 1
 */

import type { SpectralIndex } from "@/types/gee";

export type GeeProviderMode = "mock" | "service_account" | "user";

export type GeeHealthStatus = "healthy" | "degraded" | "unconfigured";

export interface GeeProviderStatus {
  id: string;
  mode: GeeProviderMode;
  isAvailable: boolean;
  isConfigured: boolean;
  message: string;
}

export interface GeeConfigurationHealth {
  isValid: boolean;
  missingVariables: string[];
  errors: string[];
  warnings: string[];
}

export interface GeeHealthCheckResult {
  status: GeeHealthStatus;
  configuration: GeeConfigurationHealth;
  provider: GeeProviderStatus;
  checkedAt: string;
}

export interface GeeIndexRequest {
  roiName: string;
  index: SpectralIndex;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
}

export interface GeeIndexResult {
  index: SpectralIndex;
  mean: number;
  min: number;
  max: number;
  sampleCount: number;
  source: "simulated" | "gee";
  computedAt: string;
}

export interface GeeImageQuery {
  collection: "landsat8" | "landsat9" | "sentinel2";
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
}

export interface GeeImageSummary {
  id: string;
  collection: GeeImageQuery["collection"];
  acquiredAt: string;
  cloudCover: number;
}

export interface GeeExportTask {
  name: string;
  format: "GeoTIFF" | "CSV" | "TFRecord";
  destination: string;
  scale: number;
}

export interface GeeExportTaskResult {
  taskId: string;
  status: "READY" | "RUNNING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface GeeExportTaskStatus {
  taskId: string;
  status: GeeExportTaskResult["status"];
  progress: number;
  updatedAt: string;
}
