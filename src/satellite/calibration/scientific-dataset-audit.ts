/**
 * Auditoría del dataset científico — determinista, sin DB/GEE.
 */

import { CANDIDATE_RELATIONSHIPS } from "../catalog/comparability.catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import type {
  IndexAvailabilityEntry,
  MissingValuesReport,
  ParameterCoverageEntry,
  ScientificDatasetAuditReport,
  StationCoverageEntry,
  TemporalCoverage,
} from "../types/scientific-calibration.types";
import { filterRealCalibrationPairs, getPredictorValueFromPair } from "./spectral-index-access";
import { evaluateCalibrationReadiness, evaluateParameterReadiness } from "./calibration-readiness";
import { countIndependentTemporalPeriods } from "./temporal-split";

const ALL_INDICES: SpectralIndexCode[] = ["NDVI", "NDCI", "NDWI", "MNDWI", "NDTI", "NDMI"];

export interface AuditContext {
  campaignCount?: number;
  measurementCount?: number;
}

function computeTemporalStats(values: number[]) {
  if (values.length === 0) {
    return { min: null, max: null, mean: null, median: null, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Number((sum / values.length).toFixed(2)),
    median: Number(median.toFixed(2)),
    count: values.length,
  };
}

function countDuplicatePairs(pairs: ScientificFieldSatellitePair[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const pair of pairs) {
    const key = `${pair.fieldMeasurementId}::${pair.satelliteObservationId ?? "none"}`;
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

function buildParameterCoverage(
  allPairs: ScientificFieldSatellitePair[],
  realPairs: ScientificFieldSatellitePair[]
): ParameterCoverageEntry[] {
  const parameterCodes = new Set<ParametroCodigoDb>();
  for (const pair of allPairs) parameterCodes.add(pair.parameterCode);

  return Array.from(parameterCodes).map((parameterCode) => {
    const paramAll = allPairs.filter((p) => p.parameterCode === parameterCode);
    const paramReal = realPairs.filter((p) => p.parameterCode === parameterCode);
    const acceptedReal = paramReal.filter((p) => p.qualityStatus === "accepted");
    const candidate = CANDIDATE_RELATIONSHIPS.find((r) => r.fieldParameterCode === parameterCode);
    const readiness = evaluateParameterReadiness(acceptedReal, parameterCode);

    return {
      parameterCode,
      totalPairs: paramAll.length,
      realPairs: paramReal.length,
      acceptedRealPairs: acceptedReal.length,
      simulatedPairs: paramAll.filter((p) => p.isSimulated).length,
      readiness: readiness.status,
      candidateIndices: candidate?.potentialExplanatoryIndices ?? [],
      warnings: readiness.warnings,
    };
  });
}

function buildStationCoverage(realPairs: ScientificFieldSatellitePair[]): StationCoverageEntry[] {
  const total = realPairs.length || 1;
  const byStation = new Map<string, number>();
  for (const pair of realPairs) {
    byStation.set(pair.stationId, (byStation.get(pair.stationId) ?? 0) + 1);
  }
  return Array.from(byStation.entries())
    .map(([stationId, realPairsCount]) => ({
      stationId,
      realPairs: realPairsCount,
      shareOfRealPairs: Number((realPairsCount / total).toFixed(4)),
    }))
    .sort((a, b) => b.realPairs - a.realPairs);
}

function buildIndexAvailability(realPairs: ScientificFieldSatellitePair[]): IndexAvailabilityEntry[] {
  return ALL_INDICES.map((index) => {
    let availableCount = 0;
    for (const pair of realPairs) {
      if (getPredictorValueFromPair(pair, index) !== null) availableCount += 1;
    }
    return {
      index,
      availableCount,
      nullCount: realPairs.length - availableCount,
    };
  });
}

function buildTemporalCoverage(realPairs: ScientificFieldSatellitePair[]): TemporalCoverage {
  const dates = realPairs.map((p) => p.fieldDate.slice(0, 10)).sort();
  if (dates.length === 0) {
    return { start: null, end: null, days: 0, independentPeriods: 0 };
  }
  const start = dates[0];
  const end = dates[dates.length - 1];
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const days = Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

  return {
    start,
    end,
    days,
    independentPeriods: countIndependentTemporalPeriods(dates),
  };
}

export function buildScientificDatasetAuditReport(
  allPairs: ScientificFieldSatellitePair[],
  context: AuditContext = {}
): ScientificDatasetAuditReport {
  const realPairs = filterRealCalibrationPairs(allPairs);
  const simulatedPairs = allPairs.filter((p) => p.isSimulated);

  const temporalDiffs = realPairs
    .map((p) => p.temporalDifferenceDays)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const missingValues: MissingValuesReport = {
    nullFieldValues: allPairs.filter((p) => !Number.isFinite(p.fieldValue)).length,
    nullPredictorIndices: realPairs.filter((p) =>
      ALL_INDICES.every((idx) => getPredictorValueFromPair(p, idx) === null)
    ).length,
    nullSatelliteDates: realPairs.filter((p) => !p.satelliteAcquisitionDate).length,
  };

  const calibrationReadiness = evaluateCalibrationReadiness(realPairs);

  return {
    totalPairs: allPairs.length,
    realPairs: realPairs.length,
    simulatedPairs: simulatedPairs.length,
    stationCount: new Set(realPairs.map((p) => p.stationId)).size,
    campaignCount: context.campaignCount ?? 0,
    sampleCount: new Set(realPairs.map((p) => p.fieldSampleId)).size,
    measurementCount: context.measurementCount ?? realPairs.length,
    sceneCount: new Set(
      realPairs.map((p) => p.satelliteSceneId).filter((s): s is string => s !== null)
    ).size,
    parameterCoverage: buildParameterCoverage(allPairs, realPairs),
    stationCoverage: buildStationCoverage(realPairs),
    temporalCoverage: buildTemporalCoverage(realPairs),
    missingValues,
    duplicatePairs: countDuplicatePairs(allPairs),
    invalidMeasurements: allPairs.filter((p) => p.qualityStatus === "invalid_measurement").length,
    temporalDifferenceStatistics: computeTemporalStats(temporalDiffs),
    indexAvailability: buildIndexAvailability(realPairs),
    calibrationReadiness,
  };
}

export function getCalibrationCandidateParameters(): ParametroCodigoDb[] {
  return [...new Set(CANDIDATE_RELATIONSHIPS.map((r) => r.fieldParameterCode))];
}

export function toCalibrationDatasetRow(
  pair: ScientificFieldSatellitePair,
  predictorIndex: SpectralIndexCode
) {
  return {
    station_id: pair.stationId,
    field_sample_id: pair.fieldSampleId,
    field_measurement_id: pair.fieldMeasurementId,
    parameter_code: pair.parameterCode,
    field_value: pair.fieldValue,
    field_unit: pair.fieldUnit,
    field_date: pair.fieldDate,
    satellite_scene_id: pair.satelliteSceneId,
    satellite_acquisition_date: pair.satelliteAcquisitionDate,
    temporal_difference_days: pair.temporalDifferenceDays,
    distance_meters: pair.distanceMeters,
    predictor_index_name: predictorIndex,
    predictor_index_value: getPredictorValueFromPair(pair, predictorIndex),
    quality_status: pair.qualityStatus,
    is_simulated: pair.isSimulated,
  };
}
