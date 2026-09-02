/**
 * Métricas de calidad del dataset científico — NO métricas de modelo.
 * Deterministas, sin Math.random().
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type {
  ScientificFieldSatellitePair,
  ScientificPairQualityStatus,
} from "../types/scientific-dataset.types";
import type { PixelQualityStatus } from "./pixel-quality";
import type { ReflectanceSemanticStatus } from "@/server/gee/gee-band.mapper";

export interface ScientificDatasetQualityReport {
  totalFieldSamples: number;
  totalSatelliteObservations: number;
  totalCandidateMatches: number;
  totalAcceptedPairs: number;
  totalRejectedPairs: number;
  totalInsufficientPairs: number;
  byQualityStatus: Record<ScientificPairQualityStatus, number>;
  byStation: Record<string, number>;
  byParameter: Record<string, number>;
  bySatelliteScene: Record<string, number>;
  byCloudStatus: {
    known: number;
    unknown: number;
    zeroPercent: number;
  };
  byReflectanceStatus: Record<ReflectanceSemanticStatus | "not_provided", number>;
  byPixelQualityStatus: Record<PixelQualityStatus | "not_provided", number>;
  acceptedPairRate: number;
  insufficientDataRate: number;
  simulatedPairRate: number;
  cloudUnknownRate: number;
  reflectanceInvalidRate: number;
}

export interface PairTraceabilityFields {
  cloudPercentage: number | null;
  reflectanceSemanticStatus?: ReflectanceSemanticStatus | null;
  pixelQualityStatus?: PixelQualityStatus | null;
}

function emptyQualityBreakdown(): Record<ScientificPairQualityStatus, number> {
  return {
    accepted: 0,
    rejected: 0,
    insufficient_data: 0,
    simulated_data: 0,
    temporal_mismatch: 0,
    spatial_mismatch: 0,
    missing_index: 0,
    invalid_measurement: 0,
  };
}

function emptyReflectanceBreakdown(): Record<
  ReflectanceSemanticStatus | "not_provided",
  number
> {
  return {
    valid: 0,
    out_of_range: 0,
    missing: 0,
    unknown: 0,
    not_provided: 0,
  };
}

function emptyPixelBreakdown(): Record<PixelQualityStatus | "not_provided", number> {
  return {
    valid: 0,
    cloud: 0,
    cloud_shadow: 0,
    cirrus: 0,
    snow: 0,
    water: 0,
    invalid: 0,
    unknown: 0,
    not_provided: 0,
  };
}

export interface BuildQualityReportInput {
  pairs: ScientificFieldSatellitePair[];
  totalFieldSamples: number;
  totalSatelliteObservations: number;
  totalCandidateMatches: number;
  traceabilityByPairId?: Map<string, PairTraceabilityFields>;
}

export function buildScientificDatasetQualityReport(
  input: BuildQualityReportInput
): ScientificDatasetQualityReport {
  const { pairs, totalFieldSamples, totalSatelliteObservations, totalCandidateMatches } = input;

  const byQualityStatus = emptyQualityBreakdown();
  const byStation: Record<string, number> = {};
  const byParameter: Record<string, number> = {};
  const bySatelliteScene: Record<string, number> = {};
  const byReflectanceStatus = emptyReflectanceBreakdown();
  const byPixelQualityStatus = emptyPixelBreakdown();

  let cloudKnown = 0;
  let cloudUnknown = 0;
  let cloudZero = 0;
  let accepted = 0;
  let rejected = 0;
  let insufficient = 0;
  let simulated = 0;
  let reflectanceInvalid = 0;

  for (const pair of pairs) {
    byQualityStatus[pair.qualityStatus] = (byQualityStatus[pair.qualityStatus] ?? 0) + 1;
    byStation[pair.stationId] = (byStation[pair.stationId] ?? 0) + 1;
    byParameter[pair.parameterCode] = (byParameter[pair.parameterCode] ?? 0) + 1;

    const sceneKey = pair.satelliteSceneId ?? "none";
    bySatelliteScene[sceneKey] = (bySatelliteScene[sceneKey] ?? 0) + 1;

    if (pair.qualityStatus === "accepted") accepted++;
    else if (pair.qualityStatus === "insufficient_data") insufficient++;
    else if (pair.qualityStatus === "simulated_data") simulated++;
    else rejected++;

    const trace = input.traceabilityByPairId?.get(pair.id);
    const cloud = trace?.cloudPercentage ?? null;
    if (cloud === null) cloudUnknown++;
    else {
      cloudKnown++;
      if (cloud === 0) cloudZero++;
    }

    const reflStatus = trace?.reflectanceSemanticStatus;
    if (reflStatus === undefined || reflStatus === null) {
      byReflectanceStatus.not_provided++;
    } else {
      byReflectanceStatus[reflStatus]++;
      if (reflStatus !== "valid") reflectanceInvalid++;
    }

    const pixelStatus = trace?.pixelQualityStatus;
    if (pixelStatus === undefined || pixelStatus === null) {
      byPixelQualityStatus.not_provided++;
    } else {
      byPixelQualityStatus[pixelStatus]++;
    }
  }

  const n = pairs.length || 1;

  return {
    totalFieldSamples,
    totalSatelliteObservations,
    totalCandidateMatches,
    totalAcceptedPairs: accepted,
    totalRejectedPairs: rejected,
    totalInsufficientPairs: insufficient,
    byQualityStatus,
    byStation,
    byParameter,
    bySatelliteScene,
    byCloudStatus: {
      known: cloudKnown,
      unknown: cloudUnknown,
      zeroPercent: cloudZero,
    },
    byReflectanceStatus,
    byPixelQualityStatus,
    acceptedPairRate: Number((accepted / n).toFixed(4)),
    insufficientDataRate: Number((insufficient / n).toFixed(4)),
    simulatedPairRate: Number((simulated / n).toFixed(4)),
    cloudUnknownRate: Number((cloudUnknown / n).toFixed(4)),
    reflectanceInvalidRate: Number((reflectanceInvalid / n).toFixed(4)),
  };
}

/** Parámetros objetivo para readiness exploratorio (reutiliza capa existente) */
export const DATASET_READINESS_PARAMETERS: ParametroCodigoDb[] = [
  "turbidity",
  "phosphates",
  "flow_rate",
  "conductivity",
];
