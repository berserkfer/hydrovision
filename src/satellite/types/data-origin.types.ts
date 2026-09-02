/**
 * Origen epistemológico de una variable — separación campo / satélite / modelo.
 * Las estimaciones satelitales NO son mediciones directas de campo.
 */

/** Origen de un dato en HydroVision */
export type SourceType = "field" | "satellite" | "model";

/** Categoría de variable de calidad del agua */
export type WaterVariableCategory =
  | "field_measured"
  | "spectral_index"
  | "satellite_estimated";

/** Metadatos mínimos compartidos para distinguir simulación vs persistencia */
export interface DataOriginMeta {
  sourceType: SourceType;
  isSimulated: boolean;
}

/** Variable medida directamente en campo (muestreo / sensor in-situ) */
export interface FieldVariableMeta extends DataOriginMeta {
  sourceType: "field";
  measurementId?: string;
  sampleId?: string;
}

/** Índice espectral o reflectancia derivada de imagen satelital */
export interface SatelliteVariableMeta extends DataOriginMeta {
  sourceType: "satellite";
  observationId?: string;
  sceneId?: string | null;
  acquisitionDate: string;
  cloudPercentage: number;
  sensor: string;
  platform: string;
  collection: string;
  processingLevel?: string;
  spatialResolutionMeters: number;
  bandsUsed: string[];
}

/** Variable estimada por modelo (calibración campo ↔ satélite) — futuro */
export interface ModelVariableMeta extends DataOriginMeta {
  sourceType: "model";
  modelId?: string;
  calibrationStatus: "not_trained" | "draft" | "validated";
  derivedFromObservationId?: string;
  derivedFromFieldMeasurementId?: string;
}

export function isFieldSource(meta: DataOriginMeta): meta is FieldVariableMeta {
  return meta.sourceType === "field";
}

export function isSatelliteSource(meta: DataOriginMeta): meta is SatelliteVariableMeta {
  return meta.sourceType === "satellite";
}

export function isModelSource(meta: DataOriginMeta): meta is ModelVariableMeta {
  return meta.sourceType === "model";
}
