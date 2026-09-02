/**
 * Configuración de integración GEE — independiente de DATA_SOURCE de monitoreo.
 */

import { geeConfig, isGeeConfigured } from "@/config/gee.config";

export function isGeeIntegrationEnabled(): boolean {
  return geeConfig.integrationEnabled && isGeeConfigured();
}

export function isGeeLiveToken(source: "simulated" | "google_oauth"): boolean {
  return source === "google_oauth";
}
