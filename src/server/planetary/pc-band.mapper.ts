/**
 * Armonización de reflectancia Sentinel-2 L2A (Planetary Computer) — conversión DN → reflectancia
 * DOCUMENTADA por ESA, no una suposición: desde processing baseline 04.00 (25 ene 2022), los
 * productos L2A aplican un offset aditivo BOA_ADD_OFFSET = -1000 antes de escalar ×10000, así que
 * reflectancia = (DN - 1000) / 10000 para baseline ≥ 04.00, y DN / 10000 antes de esa fecha.
 * Ref: https://sentinels.copernicus.eu/web/sentinel/-/copernicus-sentinel-2-major-products-upgrade-upcoming
 *
 * A diferencia de GEE (cuya escala se declara indeterminada a propósito porque la colección
 * puede variar), aquí SÍ se conoce con certeza la fuente y su documentación — por eso se aplica
 * la conversión, en vez de dejarla "likely_dn_or_scaled" sin resolver.
 */

const BOA_OFFSET_BASELINE_THRESHOLD = 4.0;
const BOA_ADD_OFFSET = 1000;
const REFLECTANCE_SCALE = 10000;

export function resolveBoaOffset(processingBaseline: string | undefined): number {
  if (!processingBaseline) return 0;
  const parsed = Number.parseFloat(processingBaseline);
  if (!Number.isFinite(parsed)) return 0;
  return parsed >= BOA_OFFSET_BASELINE_THRESHOLD ? BOA_ADD_OFFSET : 0;
}

export function convertDnToReflectance(dn: number, boaOffset: number): number {
  return (dn - boaOffset) / REFLECTANCE_SCALE;
}
