/**
 * Builder determinista del dataset científico — sin DB, GEE ni HTTP.
 */

import type { FieldSatelliteComparison } from "@/satellite/types/field-satellite-comparison.types";
import type { FieldSatelliteMatch } from "@/satellite/types/field-satellite-match.types";
import {
  evaluateScientificPairQuality,
  mapIndicesToSnapshot,
} from "@/satellite/quality/scientific-pair-quality";
import type {
  ScientificDatasetExportRow,
  ScientificDatasetSummary,
  ScientificFieldSatellitePair,
  TemporalDifferenceStatistics,
} from "@/satellite/types/scientific-dataset.types";
import type { ScientificPairQualityStatus } from "@/satellite/types/scientific-dataset.types";

function buildPairId(
  stationId: string,
  fieldSampleId: string,
  parameterCode: string,
  satelliteObservationId: string | null
): string {
  return `${stationId}::${fieldSampleId}::${parameterCode}::${satelliteObservationId ?? "none"}`;
}

function buildFieldMeasurementId(fieldSampleId: string, parameterCode: string): string {
  return `${fieldSampleId}::${parameterCode}`;
}

function computeTemporalStats(values: number[]): TemporalDifferenceStatistics {
  if (values.length === 0) {
    return { min: null, max: null, mean: null, median: null, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Number((sum / values.length).toFixed(2)),
    median: Number(median.toFixed(2)),
    count: values.length,
  };
}

const EMPTY_QUALITY_BREAKDOWN: Record<ScientificPairQualityStatus, number> = {
  accepted: 0,
  rejected: 0,
  insufficient_data: 0,
  simulated_data: 0,
  temporal_mismatch: 0,
  spatial_mismatch: 0,
  missing_index: 0,
  invalid_measurement: 0,
};

export function buildScientificFieldSatellitePairs(
  comparisons: FieldSatelliteComparison[],
  _matches?: FieldSatelliteMatch[]
): ScientificFieldSatellitePair[] {
  const createdAt = new Date().toISOString();
  const pairs: ScientificFieldSatellitePair[] = [];

  for (const comparison of comparisons) {
    const spectralIndices = mapIndicesToSnapshot(comparison.satellite.indices);

    const quality = evaluateScientificPairQuality({
      stationId: comparison.stationId,
      fieldSampleId: comparison.field.sampleId,
      parameterCode: comparison.field.parameterCode,
      fieldValue: comparison.field.value,
      fieldUnit: comparison.field.unit,
      fieldDate: comparison.field.date,
      fieldIsSimulated: comparison.field.isSimulated,
      satelliteObservationId: comparison.satellite.observationId,
      satelliteIsSimulated: comparison.satellite.isSimulated,
      matchingStatus: comparison.matching.status,
      operationallyCompatible: comparison.matching.operationallyCompatible,
      temporalDifferenceDays: comparison.matching.temporalDifferenceDays,
      distanceMeters: comparison.matching.distanceMeters,
      spectralIndices,
      cloudPercentage: comparison.satellite.cloudPercentage,
      reflectanceSemanticStatus: comparison.satellite.reflectanceSemanticStatus,
      pixelQualityStatus: comparison.satellite.pixelQualityStatus,
    });

    const fieldValue = comparison.field.value;
    if (fieldValue === null || !Number.isFinite(fieldValue)) {
      continue;
    }

    pairs.push({
      id: buildPairId(
        comparison.stationId,
        comparison.field.sampleId,
        comparison.field.parameterCode,
        comparison.satellite.observationId
      ),
      stationId: comparison.stationId,
      fieldSampleId: comparison.field.sampleId,
      fieldMeasurementId: buildFieldMeasurementId(
        comparison.field.sampleId,
        comparison.field.parameterCode
      ),
      parameterCode: comparison.field.parameterCode,
      fieldValue,
      fieldUnit: comparison.field.unit,
      fieldDate: comparison.field.date,
      satelliteObservationId: comparison.satellite.observationId,
      satelliteSceneId: comparison.satellite.sceneId,
      satelliteAcquisitionDate: comparison.satellite.acquisitionDate,
      spectralIndices,
      temporalDifferenceDays: comparison.matching.temporalDifferenceDays,
      distanceMeters: comparison.matching.distanceMeters,
      matchingStatus: comparison.matching.status,
      qualityStatus: quality.qualityStatus,
      sourceTypeField: "field",
      sourceTypeSatellite: "satellite",
      isSimulated: quality.isSimulated,
      scientificStatus: "descriptive_only",
      candidateRelationships: comparison.candidateRelationships,
      rejectionReason: quality.rejectionReason,
      createdAt,
    });
  }

  return pairs;
}

/** Evalúa calidad de todas las comparaciones, incluidas las omitidas del array pairs */
export function evaluateAllComparisonQualities(
  comparisons: FieldSatelliteComparison[]
): ScientificPairQualityStatus[] {
  return comparisons.map((comparison) => {
    const spectralIndices = mapIndicesToSnapshot(comparison.satellite.indices);
    return evaluateScientificPairQuality({
      stationId: comparison.stationId,
      fieldSampleId: comparison.field.sampleId,
      parameterCode: comparison.field.parameterCode,
      fieldValue: comparison.field.value,
      fieldUnit: comparison.field.unit,
      fieldDate: comparison.field.date,
      fieldIsSimulated: comparison.field.isSimulated,
      satelliteObservationId: comparison.satellite.observationId,
      satelliteIsSimulated: comparison.satellite.isSimulated,
      matchingStatus: comparison.matching.status,
      operationallyCompatible: comparison.matching.operationallyCompatible,
      temporalDifferenceDays: comparison.matching.temporalDifferenceDays,
      distanceMeters: comparison.matching.distanceMeters,
      spectralIndices,
      cloudPercentage: comparison.satellite.cloudPercentage,
      reflectanceSemanticStatus: comparison.satellite.reflectanceSemanticStatus,
      pixelQualityStatus: comparison.satellite.pixelQualityStatus,
    }).qualityStatus;
  });
}

export function buildScientificDatasetSummary(
  allPairs: ScientificFieldSatellitePair[],
  includedPairs: ScientificFieldSatellitePair[],
  excludedSimulatedCount: number,
  allQualityStatuses?: ScientificPairQualityStatus[]
): ScientificDatasetSummary {
  const qualityBreakdown = { ...EMPTY_QUALITY_BREAKDOWN };

  if (allQualityStatuses && allQualityStatuses.length > 0) {
    for (const status of allQualityStatuses) {
      qualityBreakdown[status] += 1;
    }
  } else {
    for (const pair of allPairs) {
      qualityBreakdown[pair.qualityStatus] += 1;
    }
  }

  const temporalValues = includedPairs
    .map((p) => p.temporalDifferenceDays)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const fieldDates = includedPairs.map((p) => p.fieldDate).filter(Boolean);
  const satDates = includedPairs
    .map((p) => p.satelliteAcquisitionDate)
    .filter((d): d is string => d !== null);

  const sortDates = (dates: string[]) =>
    dates.length > 0 ? dates.sort((a, b) => a.localeCompare(b)) : [];

  const sortedField = sortDates(fieldDates);
  const sortedSat = sortDates(satDates);

  return {
    totalPairs: allQualityStatuses?.length ?? allPairs.length,
    acceptedPairs: allPairs.filter((p) => p.qualityStatus === "accepted").length,
    rejectedPairs: allPairs.filter((p) => p.qualityStatus === "rejected").length,
    simulatedPairs: allPairs.filter((p) => p.qualityStatus === "simulated_data").length,
    insufficientPairs: allPairs.filter((p) => p.qualityStatus === "insufficient_data").length,
    excludedSimulatedPairs: excludedSimulatedCount,
    stationsCount: new Set(includedPairs.map((p) => p.stationId)).size,
    parametersCount: new Set(includedPairs.map((p) => p.parameterCode)).size,
    scenesCount: new Set(
      includedPairs.map((p) => p.satelliteSceneId).filter((s): s is string => s !== null)
    ).size,
    dateRange: {
      fieldDateMin: sortedField[0] ?? null,
      fieldDateMax: sortedField[sortedField.length - 1] ?? null,
      satelliteDateMin: sortedSat[0] ?? null,
      satelliteDateMax: sortedSat[sortedSat.length - 1] ?? null,
    },
    temporalDifferenceStatistics: computeTemporalStats(temporalValues),
    qualityBreakdown,
  };
}

export function filterPairsByIncludeSimulated(
  pairs: ScientificFieldSatellitePair[],
  includeSimulated: boolean
): { included: ScientificFieldSatellitePair[]; excludedSimulatedCount: number } {
  if (includeSimulated) {
    return { included: pairs, excludedSimulatedCount: 0 };
  }

  const simulated = pairs.filter((p) => p.isSimulated || p.qualityStatus === "simulated_data");
  const included = pairs.filter((p) => !p.isSimulated && p.qualityStatus !== "simulated_data");

  return {
    included,
    excludedSimulatedCount: simulated.length,
  };
}

export function toScientificDatasetExportRow(
  pair: ScientificFieldSatellitePair
): ScientificDatasetExportRow {
  return {
    station_id: pair.stationId,
    field_sample_id: pair.fieldSampleId,
    field_measurement_id: pair.fieldMeasurementId,
    parameter_code: pair.parameterCode,
    field_value: pair.fieldValue,
    field_unit: pair.fieldUnit,
    field_date: pair.fieldDate,
    satellite_observation_id: pair.satelliteObservationId,
    satellite_scene_id: pair.satelliteSceneId,
    satellite_acquisition_date: pair.satelliteAcquisitionDate,
    temporal_difference_days: pair.temporalDifferenceDays,
    distance_meters: pair.distanceMeters,
    ndvi: pair.spectralIndices.ndvi,
    ndci: pair.spectralIndices.ndci,
    ndwi: pair.spectralIndices.ndwi,
    mndwi: pair.spectralIndices.mndwi,
    ndti: pair.spectralIndices.ndti,
    ndmi: pair.spectralIndices.ndmi,
    matching_status: pair.matchingStatus,
    quality_status: pair.qualityStatus,
    is_simulated: pair.isSimulated,
    scientific_status: "descriptive_only",
  };
}
