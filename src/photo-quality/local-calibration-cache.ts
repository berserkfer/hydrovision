/**
 * Caché local (localStorage) de la última calibración conocida — lo que permite que el
 * Nivel 1 (offline) use la fórmula calibrada en vez de la genérica, cuando ya existió
 * conexión alguna vez para descargarla. Nunca se consulta la red desde aquí.
 */

import type { PhotoCalibrationParameterCode } from "./photo-calibration.store";

const STORAGE_KEY_PREFIX = "hv-photo-calibration-";

export interface CachedLocalCalibration {
  parameterCode: PhotoCalibrationParameterCode;
  coefficientA: number;
  coefficientB: number;
  validRange: { min: number; max: number };
  n: number;
  r2: number;
  cachedAt: string;
}

export function readCachedCalibration(
  parameterCode: PhotoCalibrationParameterCode
): CachedLocalCalibration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + parameterCode);
    if (!raw) return null;
    return JSON.parse(raw) as CachedLocalCalibration;
  } catch {
    return null;
  }
}

export function writeCachedCalibration(model: CachedLocalCalibration): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + model.parameterCode, JSON.stringify(model));
  } catch {
    // localStorage lleno/deshabilitado (modo privado, etc.) — no rompe el flujo, solo
    // significa que la próxima vez offline se usará la fórmula genérica.
  }
}
