/**
 * Proveedor satelital Sentinel-2 L2A — orden de consulta.
 *
 * Por defecto: Microsoft Planetary Computer (público, sin credenciales; es el único
 * adaptador que aplica hoy la regla de fracción de agua), con Copernicus Data Space
 * Ecosystem (CDSE) como respaldo opcional.
 *
 *   SATELLITE_PRIMARY_PROVIDER=planetary | copernicus   (por defecto: planetary)
 *   SATELLITE_PROVIDER_FALLBACK=false                   (por defecto: activado)
 *
 * El respaldo de Copernicus solo se activa si se configuran COPERNICUS_CLIENT_ID y
 * COPERNICUS_CLIENT_SECRET; sin ellas (o sin token real) se salta.
 */

export type SatelliteProviderId = "copernicus" | "planetary";

export const DEFAULT_SATELLITE_PRIMARY_PROVIDER: SatelliteProviderId = "planetary";

export function getPrimarySatelliteProvider(): SatelliteProviderId {
  const raw = process.env.SATELLITE_PRIMARY_PROVIDER?.trim().toLowerCase();
  if (raw === "copernicus" || raw === "cdse") return "copernicus";
  if (raw === "planetary" || raw === "planetary_computer") return "planetary";
  return DEFAULT_SATELLITE_PRIMARY_PROVIDER;
}

export function isSatelliteProviderFallbackEnabled(): boolean {
  return process.env.SATELLITE_PROVIDER_FALLBACK !== "false";
}

/** Orden en que se consultan los proveedores (principal primero). */
export function getSatelliteProviderOrder(): SatelliteProviderId[] {
  const primary = getPrimarySatelliteProvider();
  const secondary: SatelliteProviderId = primary === "copernicus" ? "planetary" : "copernicus";
  return isSatelliteProviderFallbackEnabled() ? [primary, secondary] : [primary];
}
