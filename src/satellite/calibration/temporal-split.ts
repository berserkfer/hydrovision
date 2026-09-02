/**
 * Split temporal y protección contra data leakage.
 * NO random split — orden cronológico por fieldDate.
 */

import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import type { TemporalSplitInfo } from "../types/scientific-calibration.types";
import { MIN_EXPLORATORY_READINESS } from "../config/calibration-readiness.config";

export interface TemporalSplitResult {
  training: ScientificFieldSatellitePair[];
  validation: ScientificFieldSatellitePair[];
  temporalSplit: TemporalSplitInfo;
}

export class TemporalLeakageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemporalLeakageError";
  }
}

export class ObservationLeakageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservationLeakageError";
  }
}

/**
 * Verifica que ninguna observación satelital aparezca en training y validation.
 */
export function assertNoObservationIdLeakage(
  training: ScientificFieldSatellitePair[],
  validation: ScientificFieldSatellitePair[]
): void {
  const trainingObs = new Set(
    training.map((p) => p.satelliteObservationId).filter((id): id is string => id !== null)
  );
  const leaked = validation
    .map((p) => p.satelliteObservationId)
    .filter((id): id is string => id !== null && trainingObs.has(id));

  if (leaked.length > 0) {
    throw new ObservationLeakageError(
      `Leakage por observación satelital: ${[...new Set(leaked)].join(", ")} presente en training y validation`
    );
  }
}

function sortByFieldDate(pairs: ScientificFieldSatellitePair[]): ScientificFieldSatellitePair[] {
  return [...pairs].sort((a, b) => a.fieldDate.localeCompare(b.fieldDate));
}

function periodFromPairs(pairs: ScientificFieldSatellitePair[]): { start: string; end: string } {
  const dates = pairs.map((p) => p.fieldDate.slice(0, 10)).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

/**
 * Verifica que ninguna fecha de entrenamiento sea posterior a la validación.
 * training debe ser periodo inicial; validation periodo posterior.
 */
export function assertNoTemporalLeakage(
  training: ScientificFieldSatellitePair[],
  validation: ScientificFieldSatellitePair[]
): void {
  if (training.length === 0 || validation.length === 0) {
    throw new TemporalLeakageError("Conjuntos de entrenamiento o validación vacíos");
  }

  const maxTrainingDate = training
    .map((p) => p.fieldDate.slice(0, 10))
    .sort()
    .pop()!;
  const minValidationDate = validation
    .map((p) => p.fieldDate.slice(0, 10))
    .sort()[0];

  if (maxTrainingDate >= minValidationDate) {
    throw new TemporalLeakageError(
      `Leakage temporal detectado: max training (${maxTrainingDate}) >= min validation (${minValidationDate})`
    );
  }
}

/**
 * Separa por fechas: periodo inicial → training, periodo posterior → validation.
 * Objetivo 70/30 pero no si deja grupos por debajo de mínimos configurados.
 */
export function splitPairsByTemporalOrder(
  pairs: ScientificFieldSatellitePair[]
): TemporalSplitResult | null {
  const sorted = sortByFieldDate(pairs);
  const n = sorted.length;

  const { minTrainingSetSize, minValidationSetSize, targetTrainingFraction } =
    MIN_EXPLORATORY_READINESS;

  if (n < minTrainingSetSize + minValidationSetSize) {
    return null;
  }

  let trainingSize = Math.floor(n * targetTrainingFraction);
  trainingSize = Math.max(trainingSize, minTrainingSetSize);
  trainingSize = Math.min(trainingSize, n - minValidationSetSize);

  const validationSize = n - trainingSize;
  if (validationSize < minValidationSetSize) {
    return null;
  }

  const training = sorted.slice(0, trainingSize);
  const validation = sorted.slice(trainingSize);

  assertNoTemporalLeakage(training, validation);
  assertNoObservationIdLeakage(training, validation);

  const trainingPeriod = periodFromPairs(training);
  const validationPeriod = periodFromPairs(validation);

  return {
    training,
    validation,
    temporalSplit: {
      trainingPeriod,
      validationPeriod,
      splitRule: `Split temporal cronológico: ${Math.round(targetTrainingFraction * 100)}% periodo inicial (training) / ${Math.round((1 - targetTrainingFraction) * 100)}% periodo posterior (validation), con mínimos training≥${minTrainingSetSize} y validation≥${minValidationSetSize}. Sin mezcla de fechas futuras en entrenamiento.`,
    },
  };
}

export function countIndependentTemporalPeriods(dates: string[]): number {
  const months = new Set(dates.map((d) => d.slice(0, 7)));
  return months.size;
}
