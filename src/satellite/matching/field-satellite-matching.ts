/**
 * Funciones puras de matching operativo campo ↔ satélite.
 * MATCHING OPERATIVO ≠ VALIDACIÓN CIENTÍFICA.
 */

import {
  MATCHING_MAX_SPATIAL_DISTANCE_METERS,
  MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS,
} from "../config/matching.config";
import type {
  FieldSatelliteMatch,
  FieldSatelliteMatchingStatus,
} from "../types/field-satellite-match.types";

export interface MatchableFieldSample {
  sampleId: string;
  stationId: string;
  date: string;
  latitude?: number;
  longitude?: number;
}

export interface MatchableSatelliteObservation {
  observationId: string;
  sceneId: string | null;
  stationId: string;
  acquisitionDate: string;
  latitude?: number;
  longitude?: number;
  isSimulated: boolean;
}

export function daysBetweenDates(dateA: string, dateB: string): number {
  const a = new Date(dateA.slice(0, 10));
  const b = new Date(dateB.slice(0, 10));
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.round(diffMs / 86_400_000);
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isTemporallyCompatible(temporalDifferenceDays: number): boolean {
  return temporalDifferenceDays <= MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS;
}

export function isSpatiallyCompatible(distanceMeters: number | null): boolean {
  if (distanceMeters === null) return false;
  return distanceMeters <= MATCHING_MAX_SPATIAL_DISTANCE_METERS;
}

function hasValidCoordinates(latitude?: number, longitude?: number): boolean {
  return (
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

function resolveMatchingStatus(
  hasField: boolean,
  hasSatellite: boolean,
  temporalDifferenceDays: number | null,
  distanceMeters: number | null
): FieldSatelliteMatchingStatus {
  if (!hasField) return "missing_field";
  if (!hasSatellite) return "missing_satellite";
  if (temporalDifferenceDays === null) return "insufficient_data";

  if (!isTemporallyCompatible(temporalDifferenceDays)) return "temporal_mismatch";
  if (distanceMeters === null) return "insufficient_data";
  if (!isSpatiallyCompatible(distanceMeters)) return "spatial_mismatch";
  return "matched";
}

export function findNearestSatelliteObservation(
  fieldSample: MatchableFieldSample,
  observations: MatchableSatelliteObservation[]
): MatchableSatelliteObservation | null {
  if (observations.length === 0) return null;

  let best: MatchableSatelliteObservation | null = null;
  let bestDiff = Infinity;

  for (const obs of observations) {
    if (obs.stationId !== fieldSample.stationId) continue;
    const diff = daysBetweenDates(fieldSample.date, obs.acquisitionDate);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = obs;
    }
  }

  return best;
}

export function computeDistanceMeters(
  field: MatchableFieldSample,
  satellite: MatchableSatelliteObservation | null
): number | null {
  if (!satellite) return null;
  if (
    !hasValidCoordinates(field.latitude, field.longitude) ||
    !hasValidCoordinates(satellite.latitude, satellite.longitude)
  ) {
    return null;
  }
  return Number(
    haversineDistanceMeters(
      field.latitude!,
      field.longitude!,
      satellite.latitude!,
      satellite.longitude!
    ).toFixed(1)
  );
}

export function matchFieldToSatellite(
  fieldSample: MatchableFieldSample,
  observations: MatchableSatelliteObservation[],
  isSimulated: boolean
): FieldSatelliteMatch {
  const nearest = findNearestSatelliteObservation(fieldSample, observations);
  const temporalDifferenceDays = nearest
    ? daysBetweenDates(fieldSample.date, nearest.acquisitionDate)
    : null;
  const distanceMeters = computeDistanceMeters(fieldSample, nearest);

  const matchingStatus = resolveMatchingStatus(
    true,
    nearest !== null,
    temporalDifferenceDays,
    distanceMeters
  );

  const operationallyCompatible =
    matchingStatus === "matched" &&
    temporalDifferenceDays !== null &&
    isTemporallyCompatible(temporalDifferenceDays) &&
    isSpatiallyCompatible(distanceMeters);

  return {
    stationId: fieldSample.stationId,
    fieldSampleId: fieldSample.sampleId,
    satelliteObservationId: nearest?.observationId ?? null,
    satelliteSceneId: nearest?.sceneId ?? null,
    fieldDate: fieldSample.date.slice(0, 10),
    satelliteAcquisitionDate: nearest?.acquisitionDate.slice(0, 10) ?? null,
    temporalDifferenceDays,
    distanceMeters,
    matchingStatus,
    sourceTypeField: "field",
    sourceTypeSatellite: "satellite",
    operationallyCompatible,
    isSimulated,
  };
}

export function matchAllFieldToSatellite(
  fieldSamples: MatchableFieldSample[],
  observations: MatchableSatelliteObservation[],
  isSimulated: boolean
): FieldSatelliteMatch[] {
  return fieldSamples.map((sample) => matchFieldToSatellite(sample, observations, isSimulated));
}
