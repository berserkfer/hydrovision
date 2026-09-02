/**
 * Resultado de verificación empírica GEE/Sentinel-2 — Prompt 11.
 * NO contiene métricas de modelo.
 */

import type { ReflectanceSemanticStatus, ReflectanceScaleEvidence } from "@/server/gee/gee-band.mapper";
import type { PixelQualityStatus } from "../quality/pixel-quality";

export type GeeVerificationStatus =
  | "GEE_LIVE_VERIFIED"
  | "GEE_LIVE_UNAVAILABLE"
  | "GEE_LIVE_FAILED"
  | "GEE_SIMULATED_ONLY";

export interface GeeSceneVerificationRecord {
  sceneId: string;
  systemIndex: string;
  systemTimeStart: number | null;
  acquisitionDate: string;
  cloudPercentage: number | null;
  collection: string;
  tileId: string | null;
  indexMatchesSystemIndex: boolean;
  acquisitionMatchesSystemTime: boolean;
}

export interface GeeReflectanceVerificationRecord {
  sceneId: string | null;
  rawBandValues: Record<string, number>;
  reflectanceSemanticStatus: ReflectanceSemanticStatus;
  scaleEvidence: ReflectanceScaleEvidence;
  pixelQualityStatus: PixelQualityStatus;
  sclRawValue: number | null;
  indicesBlocked: boolean;
}

export interface GeeEmpiricalVerificationReport {
  status: GeeVerificationStatus;
  liveExecuted: boolean;
  executedAt: string;
  collection: string;
  stationId: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  dateRange: { startDate: string; endDate: string } | null;
  configuration: {
    isConfigured: boolean;
    integrationEnabled: boolean;
    missingEnvKeys: string[];
  };
  scenes: GeeSceneVerificationRecord[];
  reflectanceSamples: GeeReflectanceVerificationRecord[];
  limitations: string[];
  errors: string[];
  /** point_sampling — no garantiza representatividad del cuerpo de agua */
  spatialRepresentativeness: "point_sampling";
  notes: string[];
}
