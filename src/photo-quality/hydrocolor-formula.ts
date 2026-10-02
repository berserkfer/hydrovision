/**
 * Fórmulas de HydroColor — verificadas contra la fuente primaria:
 *
 * Leeuw, T., & Boss, E. (2018). The HydroColor App: Above Water Measurements of Remote
 * Sensing Reflectance and Turbidity Using a Smartphone Camera. Sensors, 18(1), 256.
 * https://doi.org/10.3390/s18010256
 *
 * Verificado también contra la ficha técnica del propio laboratorio de los autores
 * (http://misclab.umeoce.maine.edu/research/HydroColor.php), que reproduce la ecuación
 * exacta de reflectancia y los coeficientes de turbidez publicados en el paper.
 *
 * Reflectancia (por banda R/G/B, independientemente):
 *   Rrs = (L_water − ρ · L_sky) / ((π / R_ref) · L_card)
 *   ρ = 0.028 (factor de reflexión especular del cielo en el agua, geometría de 40° desde
 *       nadir / 135° respecto al sol — Mobley 1999, adoptado por HydroColor).
 *   R_ref = 0.18 (reflectancia estándar de la cartulina gris fotográfica al 18%).
 *
 * Turbidez desde Rrs(rojo):
 *   Turb = 22.57 · Rrs(R) / (0.044 − Rrs(R))   [NTU/FTU]
 *   0.044 sr⁻¹ es el valor de saturación de Rrs(rojo) reportado por los autores — cerca o
 *   por encima de ese valor el modelo no es válido (asíntota). Rango de validez reportado
 *   por los propios autores: ~0–80 NTU. Error mediano reportado frente a turbidímetro
 *   profesional: ~24%.
 *
 * SIMPLIFICACIÓN DOCUMENTADA (no oculta): igual que la mayoría de reimplementaciones de
 * HydroColor, aquí L_water/L_sky/L_card son el promedio de píxeles RGB (0–255) de cada
 * foto — no una radiancia calibrada por sensor de luz del teléfono. Los propios autores
 * señalan esto como limitación ("light intensity is from images, not directly from phone
 * light sensor"), no es un error nuestro: es la misma aproximación que usa la app original
 * en la práctica.
 */

export const HYDROCOLOR_RHO_SKY_GLINT = 0.028;
export const HYDROCOLOR_GRAY_CARD_REFLECTANCE = 0.18;
export const HYDROCOLOR_TURBIDITY_A = 22.57;
/** Saturación de Rrs(rojo) — sr⁻¹. Cerca/sobre este valor el modelo deja de ser válido. */
export const HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED = 0.044;
export const HYDROCOLOR_VALID_TURBIDITY_RANGE_NTU = { min: 0, max: 80 } as const;
export const HYDROCOLOR_REPORTED_MEDIAN_ERROR_PERCENT = 24;

export const HYDROCOLOR_CITATION =
  "Leeuw, T., & Boss, E. (2018). The HydroColor App: Above Water Measurements of Remote Sensing Reflectance and Turbidity Using a Smartphone Camera. Sensors, 18(1), 256. https://doi.org/10.3390/s18010256";

export interface RgbMeans {
  r: number;
  g: number;
  b: number;
}

/**
 * Rrs para una sola banda — misma ecuación aplicada independientemente a R, G y B.
 * Retorna null si el denominador es cero/inválido (cartulina completamente negra en la
 * foto, por ejemplo) — nunca fabrica un valor.
 */
export function computeRrsChannel(waterMean: number, skyMean: number, cardMean: number): number | null {
  if (cardMean <= 0 || !Number.isFinite(cardMean)) return null;
  const denominator = (Math.PI / HYDROCOLOR_GRAY_CARD_REFLECTANCE) * cardMean;
  if (denominator === 0 || !Number.isFinite(denominator)) return null;
  const numerator = waterMean - HYDROCOLOR_RHO_SKY_GLINT * skyMean;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export interface RrsRgb {
  r: number | null;
  g: number | null;
  b: number | null;
}

export function computeRrsRgb(water: RgbMeans, sky: RgbMeans, card: RgbMeans): RrsRgb {
  return {
    r: computeRrsChannel(water.r, sky.r, card.r),
    g: computeRrsChannel(water.g, sky.g, card.g),
    b: computeRrsChannel(water.b, sky.b, card.b),
  };
}

export interface TurbidityEstimate {
  ntu: number;
  saturated: false;
}
export interface TurbidityUnavailable {
  ntu: null;
  saturated: true;
  reason: string;
}

/**
 * Turbidez desde Rrs(rojo) — ecuación (22.57 · x)/(0.044 − x) publicada por Leeuw & Boss
 * (2018). Nunca extrapola más allá del punto de saturación: por encima de ~95% del valor
 * de saturación (0.044 sr⁻¹) el modelo deja de ser confiable y se rechaza explícitamente,
 * igual que se hace con el modelo de Nechad et al. (2010) en el módulo satelital.
 */
export function estimateTurbidityFromRrsRed(rrsRed: number | null): TurbidityEstimate | TurbidityUnavailable {
  if (rrsRed === null || !Number.isFinite(rrsRed)) {
    return { ntu: null, saturated: true, reason: "Rrs(rojo) no disponible — no se puede estimar turbidez." };
  }
  if (rrsRed <= 0) {
    return {
      ntu: null,
      saturated: true,
      reason: "Rrs(rojo) no positivo — geometría de la foto probablemente incorrecta (reflejo del cielo, sombra, etc.).",
    };
  }
  if (rrsRed >= HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED * 0.95) {
    return {
      ntu: null,
      saturated: true,
      reason: `Rrs(rojo)=${rrsRed.toFixed(4)} está en o cerca del punto de saturación del modelo (${HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED} sr⁻¹) — agua demasiado turbia para esta ecuación, fuera de su rango válido (~0–80 NTU).`,
    };
  }
  const ntu =
    (HYDROCOLOR_TURBIDITY_A * rrsRed) / (HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED - rrsRed);
  if (!Number.isFinite(ntu) || ntu < 0) {
    return { ntu: null, saturated: true, reason: "Resultado no numérico o negativo — no se fabrica un valor." };
  }
  return { ntu: Number(ntu.toFixed(2)), saturated: false };
}

/**
 * Índice cualitativo (SIN cartulina de referencia) — nunca produce un número en NTU, porque
 * sin cartulina no hay forma de calibrar la reflectancia absoluta (ver Rrs arriba). Es solo
 * un ratio rojo/verde de los píxeles crudos del agua: más alto suele asociarse a agua con
 * más sedimento/turbia, pero es puramente relativo, no comparable entre fotos ni con NTU.
 */
export function computeQualitativeColorIndex(water: RgbMeans): number | null {
  if (water.g <= 0) return null;
  return Number((water.r / water.g).toFixed(4));
}
