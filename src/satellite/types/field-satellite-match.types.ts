/**
 * Contrato de enlace entre medición de campo y observación satelital.
 */

import type { SourceType } from "./data-origin.types";

export type FieldSatelliteMatchingStatus =
  | "matched"
  | "temporal_mismatch"
  | "spatial_mismatch"
  | "missing_satellite"
  | "missing_field"
  | "insufficient_data";

export interface FieldSatelliteMatch {
  stationId: string;
  /** Identificador del muestreo / muestra de campo */
  fieldSampleId: string;
  /** Identificador de observación satelital emparejada (puede ser null) */
  satelliteObservationId: string | null;
  /** Identificador de escena Sentinel-2 */
  satelliteSceneId: string | null;
  fieldDate: string;
  satelliteAcquisitionDate: string | null;
  temporalDifferenceDays: number | null;
  distanceMeters: number | null;
  matchingStatus: FieldSatelliteMatchingStatus;
  sourceTypeField: Extract<SourceType, "field">;
  sourceTypeSatellite: Extract<SourceType, "satellite">;
  /** Indica si el emparejamiento cumple criterios operativos (no científicos) */
  operationallyCompatible: boolean;
  isSimulated: boolean;
}
