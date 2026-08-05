/**
 * Facade pública GEE para scripts y servicios server-side — Sprint 1
 */

import {
  getGeeHealthService,
  getGeeProvider,
  type GeeHealthCheckResult,
  type IGEEProvider,
} from "@/services/google-earth-engine";
import { validateGeeConfig, isGeeConfigured } from "@/config/gee.config";

export function getGeeClient(): IGEEProvider {
  return getGeeProvider();
}

export function runGeeHealthCheck(): GeeHealthCheckResult {
  const healthService = getGeeHealthService();
  return healthService.check();
}

export function printGeeHealthReport(): string {
  const healthService = getGeeHealthService();
  const result = healthService.check();
  return healthService.formatReport(result);
}

export { validateGeeConfig, isGeeConfigured };
export { getGeeProvider, getGeeHealthService } from "@/services/google-earth-engine";
export type { GeeHealthCheckResult, IGEEProvider };
