/**
 * Fracción de agua por píxel y suficiencia de píxeles acuáticos.
 *
 * Un píxel Sentinel-2 de 10 m sobre un dren de ~10–20 m mezcla agua con orilla.
 * En vez de descartar los píxeles mezclados (lo que puede dejar la serie vacía),
 * se cuantifica qué fracción de la ventana analizada es agua y se exige un
 * mínimo antes de emitir cualquier valor.
 */

export type WaterSufficiency = "sufficient" | "insufficient" | "unknown";

/** Fracción mínima de píxeles de agua para considerar la ventana utilizable. */
export const WATER_FRACTION_THRESHOLD = 0.5;

/** Píxeles válidos mínimos en la ventana. */
export const MIN_WATER_PIXELS = 3;

/** NDWI de McFeeters (1996): (verde − NIR) / (verde + NIR). */
export function computeNdwi(
  green: number | null | undefined,
  nir: number | null | undefined
): number | null {
  if (green == null || nir == null) return null;
  if (!Number.isFinite(green) || !Number.isFinite(nir)) return null;
  const denominator = green + nir;
  if (denominator === 0) return null;
  return (green - nir) / denominator;
}

export interface WaterPixelInput {
  green: number | null;
  nir: number | null;
}

export interface WaterFractionResult {
  waterFraction: number | null;
  pixelsUsed: number;
}

/**
 * Fracción de píxeles con NDWI > umbral sobre los píxeles válidos.
 * `threshold = 0` es el criterio clásico de agua abierta.
 */
export function computeWaterFraction(
  pixels: WaterPixelInput[],
  threshold = 0
): WaterFractionResult {
  const ndwis = pixels
    .map((p) => computeNdwi(p.green, p.nir))
    .filter((v): v is number => v !== null);

  if (ndwis.length === 0) {
    return { waterFraction: null, pixelsUsed: 0 };
  }

  const waterPixels = ndwis.filter((v) => v > threshold).length;
  return {
    waterFraction: waterPixels / ndwis.length,
    pixelsUsed: ndwis.length,
  };
}

export function assessWaterSufficiency(
  waterFraction: number | null,
  pixelsUsed: number,
  options?: { threshold?: number; minPixels?: number }
): WaterSufficiency {
  const threshold = options?.threshold ?? WATER_FRACTION_THRESHOLD;
  const minPixels = options?.minPixels ?? MIN_WATER_PIXELS;

  if (waterFraction === null) return "unknown";
  if (pixelsUsed < minPixels) return "insufficient";
  return waterFraction >= threshold ? "sufficient" : "insufficient";
}
