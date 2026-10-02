/**
 * Configuración de integración Copernicus — independiente de DATA_SOURCE de monitoreo.
 * Mirror de gee-integration.config.ts para mantener consistencia arquitectónica.
 */

import { copernicusConfig, isCopernicusConfigured } from "./copernicus.config";

export function isCopernicusIntegrationEnabled(): boolean {
  return copernicusConfig.integrationEnabled && isCopernicusConfigured();
}

export function isCopernicusLiveToken(source: "simulated" | "copernicus_oauth"): boolean {
  return source === "copernicus_oauth";
}
