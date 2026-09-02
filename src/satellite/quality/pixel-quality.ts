/**
 * Calidad de píxel Sentinel-2 — capa QC explícita (SCL).
 * Diferencia metadata de escena (CLOUDY_PIXEL_PERCENTAGE) de calidad de píxel (SCL).
 * NO implementa máscara compleja — interpretación documentada de SCL en point sampling.
 */

/** Estados de calidad de píxel — no confundir con cloudPercentage de escena */
export type PixelQualityStatus =
  | "valid"
  | "cloud"
  | "cloud_shadow"
  | "cirrus"
  | "snow"
  | "water"
  | "invalid"
  | "unknown";

/** Valores SCL en COPERNICUS/S2_SR_HARMONIZED (Scene Classification Layer) */
export const SCL_CLASS = {
  NO_DATA: 0,
  SATURATED: 1,
  DARK: 2,
  CLOUD_SHADOW: 3,
  VEGETATION: 4,
  BARE_SOIL: 5,
  WATER: 6,
  UNCLASSIFIED: 7,
  CLOUD_MEDIUM: 8,
  CLOUD_HIGH: 9,
  THIN_CIRRUS: 10,
  SNOW: 11,
} as const;

/**
 * Interpreta valor SCL en el píxel muestreado.
 * SCL 6 (water) NO implica automáticamente representatividad espacial del cuerpo de agua.
 */
export function interpretSclPixelQuality(scl: number | null | undefined): PixelQualityStatus {
  if (scl === null || scl === undefined || !Number.isFinite(scl)) {
    return "unknown";
  }

  const code = Math.round(scl);

  switch (code) {
    case SCL_CLASS.VEGETATION:
    case SCL_CLASS.BARE_SOIL:
      return "valid";
    case SCL_CLASS.WATER:
      return "water";
    case SCL_CLASS.CLOUD_SHADOW:
      return "cloud_shadow";
    case SCL_CLASS.CLOUD_MEDIUM:
    case SCL_CLASS.CLOUD_HIGH:
      return "cloud";
    case SCL_CLASS.THIN_CIRRUS:
      return "cirrus";
    case SCL_CLASS.SNOW:
      return "snow";
    case SCL_CLASS.NO_DATA:
    case SCL_CLASS.SATURATED:
    case SCL_CLASS.DARK:
      return "invalid";
    case SCL_CLASS.UNCLASSIFIED:
      return "unknown";
    default:
      return "unknown";
  }
}

/** Píxeles aptos para índices espectrales en QC científico (excluye nube/sombra/cirrus/nieve/inválido/desconocido) */
export function isPixelQualityAcceptableForIndices(status: PixelQualityStatus): boolean {
  return status === "valid" || status === "water";
}

/** Píxeles contaminados por nubes o sombra — no válidos científicamente */
export function isPixelContaminated(status: PixelQualityStatus): boolean {
  return status === "cloud" || status === "cloud_shadow" || status === "cirrus";
}
