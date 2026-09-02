/**
 * Criterios operativos de matching campo ↔ satélite.
 * NO son validación científica — solo determinan qué pares pueden compararse descriptivamente.
 */

/** Diferencia temporal máxima (días) para matching operativo Sentinel-2 (~revisita 5 d) */
export const MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS = 7;

/** Distancia espacial máxima (m) entre punto de muestreo y pixel satelital */
export const MATCHING_MAX_SPATIAL_DISTANCE_METERS = 500;

/** Cobertura nubosa máxima recomendada para considerar escena (referencia operativa) */
export const MATCHING_MAX_CLOUD_PERCENTAGE = 30;

export const MATCHING_DISCLAIMER =
  "Criterios operativos iniciales de HydroVision. No implican validez científica ni correlación." as const;

export const MATCHING_CRITERIA_SUMMARY = {
  maxTemporalDifferenceDays: MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS,
  maxSpatialDistanceMeters: MATCHING_MAX_SPATIAL_DISTANCE_METERS,
  maxCloudPercentage: MATCHING_MAX_CLOUD_PERCENTAGE,
  purpose: "operational_matching_only",
} as const;
