/**
 * Microsoft Planetary Computer — catálogo STAC público de Sentinel-2 L2A.
 *
 * A diferencia de GEE/Copernicus, NO requiere cuenta, client_id ni client_secret:
 * la búsqueda STAC y la firma de assets (SAS) son endpoints públicos sin autenticación.
 * Ver https://planetarycomputer.microsoft.com/docs/reference/stac/ y
 * https://planetarycomputer.microsoft.com/docs/concepts/sas/
 *
 * Por eso esta integración no tiene "modo simulado" por falta de credenciales — si el
 * adaptador falla, es por la red o por ausencia de escenas, nunca por configuración faltante.
 */

export const PLANETARY_COMPUTER_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
export const PLANETARY_COMPUTER_SIGN_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/sign";
export const PLANETARY_COMPUTER_COLLECTION = "sentinel-2-l2a" as const;

export function isPlanetaryComputerEnabled(): boolean {
  return process.env.PLANETARY_COMPUTER_ENABLED !== "false";
}
