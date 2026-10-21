/**
 * Origen epistemológico de una variable — separación campo / satélite / modelo.
 * Las estimaciones satelitales NO son mediciones directas de campo.
 */

/** Origen de un dato en HydroVision */
export type SourceType = "field" | "satellite" | "model";

/**
 * Proveedor que sirvió un dato satelital. "unknown" cuando no se puede determinar
 * (observaciones antiguas sin el campo): nunca se adivina.
 */
export type SatelliteDataProvider = "planetary" | "copernicus" | "gee" | "database" | "mock" | "unknown";

const PROVIDER_ID_PREFIXES: Array<[string, SatelliteDataProvider]> = [
  ["planetary-", "planetary"],
  ["copernicus-", "copernicus"],
  ["gee-", "gee"],
];

/**
 * Proveedor declarado o, si falta, deducido del prefijo del id de observación
 * (los builders generan `planetary-…`, `copernicus-…`, `gee-…`).
 */
export function resolveSatelliteProvider(
  declared: SatelliteDataProvider | undefined | null,
  observationId: string | null | undefined
): SatelliteDataProvider {
  if (declared) return declared;
  if (observationId) {
    for (const [prefix, provider] of PROVIDER_ID_PREFIXES) {
      if (observationId.startsWith(prefix)) return provider;
    }
  }
  return "unknown";
}

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
