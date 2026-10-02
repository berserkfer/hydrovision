/**
 * El cálculo del Nivel 1 — 100% puro, 100% síncrono, CERO llamadas de red. Es literalmente
 * lo único que debe funcionar sin conexión (Tarea 3 del prompt): esta función no importa
 * nada que dependa de fetch/servidor, así que corre igual con el dispositivo en modo avión.
 * El resultado se puede luego "mejorar" a Nivel 2/3 pasando los flags que solo se conocen
 * en línea (ver usePhotoCapture.ts) — pero el Nivel 1 nunca espera por eso.
 */

import {
  computeQualitativeColorIndex,
  computeRrsRgb,
  estimateTurbidityFromRrsRed,
  type RgbMeans,
  type RrsRgb,
} from "./hydrocolor-formula";
import { predictLinear } from "@/satellite/calibration/linear-regression";
import { resolvePhotoConfidence, type PhotoConfidenceResult } from "./confidence-tiers";
import type { CachedLocalCalibration } from "./local-calibration-cache";

export interface OfflinePhotoEstimateInput {
  waterRgb: RgbMeans;
  skyRgb: RgbMeans;
  cardRgb: RgbMeans | null;
  hasReferencePanel: boolean;
  isOnline: boolean;
  cachedCalibration: CachedLocalCalibration | null;
  /** Solo se conoce en línea, tras consultar el servidor — ver usePhotoCapture. */
  labCalibrationSufficientNow?: boolean;
  /** Solo se conoce en línea, tras consultar el servidor — ver usePhotoCapture. */
  satelliteSceneFound?: boolean;
}

export interface OfflinePhotoEstimateResult {
  rrs: RrsRgb | null;
  qualitativeColorIndex: number | null;
  turbidityNtu: number | null;
  turbiditySaturated: boolean;
  turbiditySource: "hydrocolor_generic" | "local_lab_calibration" | null;
  outOfCalibratedRange: boolean;
  confidence: PhotoConfidenceResult;
}

export function computeOfflinePhotoEstimate(
  input: OfflinePhotoEstimateInput
): OfflinePhotoEstimateResult {
  const confidence = resolvePhotoConfidence({
    isOnline: input.isOnline,
    hasCachedLocalCalibration: input.cachedCalibration !== null,
    labCalibrationSufficientNow: input.labCalibrationSufficientNow ?? false,
    satelliteSceneFound: input.satelliteSceneFound ?? false,
  });

  // Sin cartulina de referencia: nunca se fabrica un Rrs calibrado ni un NTU — solo un
  // índice cualitativo de color, explícitamente marcado como tal.
  if (!input.hasReferencePanel || !input.cardRgb) {
    return {
      rrs: null,
      qualitativeColorIndex: computeQualitativeColorIndex(input.waterRgb),
      turbidityNtu: null,
      turbiditySaturated: false,
      turbiditySource: null,
      outOfCalibratedRange: false,
      confidence,
    };
  }

  const rrs = computeRrsRgb(input.waterRgb, input.skyRgb, input.cardRgb);

  const useCalibration =
    confidence.formulaSource === "local_lab_calibration" &&
    input.cachedCalibration !== null &&
    rrs.r != null;

  if (useCalibration && input.cachedCalibration && rrs.r != null) {
    const cal = input.cachedCalibration;
    const value = predictLinear({ coefficientA: cal.coefficientA, coefficientB: cal.coefficientB }, rrs.r);
    const outOfRange = rrs.r < cal.validRange.min || rrs.r > cal.validRange.max;
    return {
      rrs,
      qualitativeColorIndex: null,
      turbidityNtu: Number(value.toFixed(2)),
      turbiditySaturated: false,
      turbiditySource: "local_lab_calibration",
      outOfCalibratedRange: outOfRange,
      confidence,
    };
  }

  const turbidity = estimateTurbidityFromRrsRed(rrs.r);
  return {
    rrs,
    qualitativeColorIndex: null,
    turbidityNtu: turbidity.ntu,
    turbiditySaturated: turbidity.saturated,
    turbiditySource: "hydrocolor_generic",
    outOfCalibratedRange: false,
    confidence,
  };
}
