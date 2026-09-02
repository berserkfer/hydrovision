/**
 * Evaluación de calibration readiness — por parámetro y global.
 */

import { getCandidateRelationshipsForParameter } from "../catalog/comparability.catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import {
  MIN_EXPLORATORY_READINESS,
  MIN_EXPLORATORY_READINESS_DISCLAIMER,
} from "../config/calibration-readiness.config";
import type {
  CalibrationReadinessResult,
  CalibrationReadinessStatus,
} from "../types/scientific-calibration.types";
import type { ScientificFieldSatellitePair } from "../types/scientific-dataset.types";
import { getPredictorValueFromPair } from "./spectral-index-access";
import { countIndependentTemporalPeriods } from "./temporal-split";

function buildResult(
  status: CalibrationReadinessStatus,
  reasons: string[],
  warnings: string[],
  meetsMinimum: boolean
): CalibrationReadinessResult {
  return {
    status,
    reasons,
    warnings,
    meetsMinimumExploratoryCriteria: meetsMinimum,
  };
}

function dominantStationShare(pairs: ScientificFieldSatellitePair[]): number {
  if (pairs.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const pair of pairs) {
    counts.set(pair.stationId, (counts.get(pair.stationId) ?? 0) + 1);
  }
  return Math.max(...counts.values()) / pairs.length;
}

function hasValidIndexForParameter(
  pairs: ScientificFieldSatellitePair[],
  parameterCode: ParametroCodigoDb
): boolean {
  const candidates = getCandidateRelationshipsForParameter(parameterCode);
  if (candidates.length === 0) return false;

  const indices = candidates.flatMap((c) => c.potentialExplanatoryIndices);
  return pairs.some((pair) =>
    indices.some((idx) => getPredictorValueFromPair(pair, idx) !== null)
  );
}

function countPairsWithPredictor(
  pairs: ScientificFieldSatellitePair[],
  predictorIndex: SpectralIndexCode
): number {
  return pairs.filter((p) => getPredictorValueFromPair(p, predictorIndex) !== null).length;
}

export function evaluateParameterReadiness(
  realAcceptedPairs: ScientificFieldSatellitePair[],
  parameterCode: ParametroCodigoDb,
  predictorIndex?: SpectralIndexCode
): CalibrationReadinessResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const {
    minRealPairs,
    minStations,
    minIndependentTemporalPeriods,
    maxSingleStationShare,
  } = MIN_EXPLORATORY_READINESS;

  const paramPairs = realAcceptedPairs.filter((p) => p.parameterCode === parameterCode);

  if (paramPairs.length === 0) {
    return buildResult(
      "INSUFFICIENT_REAL_DATA",
      [`Sin pares reales aceptados para parámetro ${parameterCode}`],
      [],
      false
    );
  }

  const candidates = getCandidateRelationshipsForParameter(parameterCode);
  if (candidates.length === 0) {
    return buildResult(
      "INSUFFICIENT_PARAMETER_COVERAGE",
      [`Parámetro ${parameterCode} sin relaciones candidatas en comparability.catalog`],
      [],
      false
    );
  }

  if (predictorIndex) {
    const allowed = candidates.some((c) =>
      c.potentialExplanatoryIndices.includes(predictorIndex)
    );
    if (!allowed) {
      return buildResult(
        "INSUFFICIENT_PARAMETER_COVERAGE",
        [`Índice ${predictorIndex} no es candidato para ${parameterCode}`],
        [],
        false
      );
    }
    const withPredictor = countPairsWithPredictor(paramPairs, predictorIndex);
    if (withPredictor < minRealPairs) {
      reasons.push(
        `Solo ${withPredictor} pares con ${predictorIndex} no nulo (mínimo ${minRealPairs})`
      );
    }
  }

  if (paramPairs.length < minRealPairs) {
    reasons.push(`Solo ${paramPairs.length} pares reales (mínimo ${minRealPairs})`);
  }

  const stations = new Set(paramPairs.map((p) => p.stationId));
  if (stations.size < minStations) {
    reasons.push(`Solo ${stations.size} estaciones (mínimo ${minStations})`);
  }

  const dates = paramPairs.map((p) => p.fieldDate.slice(0, 10));
  const periods = countIndependentTemporalPeriods(dates);
  if (periods < minIndependentTemporalPeriods) {
    reasons.push(
      `Solo ${periods} periodos temporales independientes (mínimo ${minIndependentTemporalPeriods})`
    );
  }

  if (!hasValidIndexForParameter(paramPairs, parameterCode)) {
    reasons.push("Ningún índice candidato disponible (todos null)");
  }

  const stationShare = dominantStationShare(paramPairs);
  if (stationShare > maxSingleStationShare) {
    warnings.push(
      `Una estación concentra ${(stationShare * 100).toFixed(0)}% de los pares (umbral ${maxSingleStationShare * 100}%)`
    );
  }

  if (paramPairs.length < minRealPairs * 1.5) {
    warnings.push("Tamaño muestral cercano al mínimo exploratorio");
  }

  const largeTemporalDiff = paramPairs.filter(
    (p) => (p.temporalDifferenceDays ?? 0) > 5
  ).length;
  if (largeTemporalDiff > paramPairs.length * 0.5) {
    warnings.push("Diferencias temporales campo-satélite elevadas en >50% de pares");
  }

  if (reasons.some((r) => r.includes("Ningún índice"))) {
    return buildResult("INSUFFICIENT_INDEX_COVERAGE", reasons, warnings, false);
  }
  if (reasons.some((r) => r.includes("periodos temporales"))) {
    return buildResult("INSUFFICIENT_TEMPORAL_COVERAGE", reasons, warnings, false);
  }
  if (reasons.some((r) => r.includes("estaciones"))) {
    return buildResult("INSUFFICIENT_STATION_COVERAGE", reasons, warnings, false);
  }
  if (reasons.length > 0) {
    return buildResult("INSUFFICIENT_REAL_DATA", reasons, warnings, false);
  }

  if (warnings.length > 0) {
    return buildResult("READY_WITH_WARNINGS", [], warnings, true);
  }

  return buildResult("READY", [], [], true);
}

export function evaluateCalibrationReadiness(
  realAcceptedPairs: ScientificFieldSatellitePair[]
): CalibrationReadinessResult {
  if (realAcceptedPairs.length === 0) {
    return buildResult(
      "INSUFFICIENT_REAL_DATA",
      ["No hay pares reales aceptados para calibración"],
      [],
      false
    );
  }

  const duplicateCheck = new Set(
    realAcceptedPairs.map((p) => `${p.fieldMeasurementId}::${p.satelliteObservationId}`)
  );
  if (duplicateCheck.size < realAcceptedPairs.length) {
    return buildResult(
      "DATA_QUALITY_FAILURE",
      ["Duplicados exactos detectados en pares reales"],
      [],
      false
    );
  }

  const overallWarnings: string[] = [];
  if (realAcceptedPairs.length < MIN_EXPLORATORY_READINESS.minRealPairs) {
    return buildResult(
      "INSUFFICIENT_REAL_DATA",
      [
        `Solo ${realAcceptedPairs.length} pares reales aceptados (mínimo ${MIN_EXPLORATORY_READINESS.minRealPairs})`,
      ],
      overallWarnings,
      false
    );
  }

  const stations = new Set(realAcceptedPairs.map((p) => p.stationId));
  if (stations.size < MIN_EXPLORATORY_READINESS.minStations) {
    return buildResult(
      "INSUFFICIENT_STATION_COVERAGE",
      [
        `Solo ${stations.size} estaciones con datos reales (mínimo ${MIN_EXPLORATORY_READINESS.minStations})`,
      ],
      overallWarnings,
      false
    );
  }

  const share = dominantStationShare(realAcceptedPairs);
  if (share > MIN_EXPLORATORY_READINESS.maxSingleStationShare) {
    overallWarnings.push(`Estación dominante: ${(share * 100).toFixed(0)}% de pares`);
  }

  overallWarnings.push(MIN_EXPLORATORY_READINESS_DISCLAIMER);

  if (overallWarnings.length > 1) {
    return buildResult("READY_WITH_WARNINGS", [], overallWarnings, true);
  }

  return buildResult("READY", [], [MIN_EXPLORATORY_READINESS_DISCLAIMER], true);
}

export function isReadinessSufficientForCalibration(
  status: CalibrationReadinessStatus
): boolean {
  return status === "READY" || status === "READY_WITH_WARNINGS";
}
