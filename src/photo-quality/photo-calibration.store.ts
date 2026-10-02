/**
 * Base de pares de calibración del módulo de foto — foto (Rrs rojo) + valor real de
 * laboratorio de la MISMA muestra. Almacén propio en memoria (mock), mismo patrón que
 * mockHistory en import.repository.ts — no reutiliza la base de calibración satelital
 * (comparabilidad distinta: aquí el predictor es Rrs de una foto de celular, no una banda
 * Sentinel-2), pero SÍ reutiliza el motor de regresión/métricas (ver photo-calibration.service.ts).
 */

export type PhotoCalibrationParameterCode = "turbidity" | "total_suspended_solids";

export interface PhotoCalibrationPair {
  id: string;
  parameterCode: PhotoCalibrationParameterCode;
  capturedAt: string;
  rrsRed: number;
  labValue: number;
  labDate: string;
  source: "lab_manual";
}

const pairs: PhotoCalibrationPair[] = [];

export function addPhotoCalibrationPair(pair: PhotoCalibrationPair): { created: boolean } {
  if (pairs.some((p) => p.id === pair.id)) return { created: false };
  pairs.push(pair);
  return { created: true };
}

export function listPhotoCalibrationPairs(
  parameterCode: PhotoCalibrationParameterCode
): PhotoCalibrationPair[] {
  return pairs.filter((p) => p.parameterCode === parameterCode);
}

/** Solo para tests — nunca se usa en código de producción. */
export function __resetPhotoCalibrationStoreForTests(): void {
  pairs.length = 0;
}
