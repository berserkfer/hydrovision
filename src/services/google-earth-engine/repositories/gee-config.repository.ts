/**
 * Repository Pattern — acceso a configuración GEE (compatibilidad Sprint 1+2)
 */

import {
  GEE_AUTH_ENV_KEYS,
  geeConfig,
  hasGeePrivateKey,
  validateGeeConfig,
  type GeeConfigValidation,
} from "@/config/gee.config";

export class GeeConfigRepository {
  getProjectId(): string {
    return geeConfig.earthEngineProjectId;
  }

  getGoogleProjectId(): string {
    return geeConfig.googleProjectId;
  }

  getClientEmail(): string {
    return geeConfig.clientEmail;
  }

  getServiceAccount(): string {
    return geeConfig.serviceAccountLegacy;
  }

  hasPrivateKey(): boolean {
    return hasGeePrivateKey();
  }

  isIntegrationEnabled(): boolean {
    return geeConfig.integrationEnabled;
  }

  getRequiredEnvKeys(): string[] {
    return Object.values(GEE_AUTH_ENV_KEYS);
  }

  validate(): GeeConfigValidation {
    return validateGeeConfig();
  }
}

export const geeConfigRepository = new GeeConfigRepository();
