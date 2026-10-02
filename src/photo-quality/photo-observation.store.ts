/**
 * Almacén (mock, en memoria) de observaciones por foto — sincronizadas desde el cliente.
 * Idempotente por `id` (UUID generado en el dispositivo): si la misma observación se
 * reenvía (ej. reintento de sincronización tras recuperar señal), NUNCA se duplica.
 */

import { addPhotoCalibrationPair } from "./photo-calibration.store";
import type { PhotoObservationInput, PhotoObservationRecord } from "./photo-observation.types";

const observations: PhotoObservationRecord[] = [];

export interface SavePhotoObservationResult {
  created: boolean;
  record: PhotoObservationRecord;
  calibrationPairAdded: boolean;
  calibrationPairRejectedReason?: string;
}

export function savePhotoObservation(input: PhotoObservationInput): SavePhotoObservationResult {
  const existing = observations.find((o) => o.id === input.id);
  if (existing) {
    return { created: false, record: existing, calibrationPairAdded: false };
  }

  const record: PhotoObservationRecord = { ...input, receivedAt: new Date().toISOString() };
  observations.push(record);

  let calibrationPairAdded = false;
  let calibrationPairRejectedReason: string | undefined;

  if (input.labSample) {
    if (input.rrs?.r == null) {
      calibrationPairRejectedReason =
        "No se agregó a la base de calibración: sin cartulina de referencia no hay Rrs calibrado que asociar al valor de laboratorio.";
    } else {
      const { created } = addPhotoCalibrationPair({
        id: `calib-${input.id}`,
        parameterCode: input.labSample.parameterCode,
        capturedAt: input.capturedAt,
        rrsRed: input.rrs.r,
        labValue: input.labSample.value,
        labDate: input.labSample.labDate,
        source: "lab_manual",
      });
      calibrationPairAdded = created;
    }
  }

  return { created: true, record, calibrationPairAdded, calibrationPairRejectedReason };
}

export function listPhotoObservations(): PhotoObservationRecord[] {
  return [...observations];
}

/** Solo para tests. */
export function __resetPhotoObservationStoreForTests(): void {
  observations.length = 0;
}
