/**
 * Repository Pattern — credenciales GEE (solo servidor)
 */

import {
  GEE_AUTH_ENV_KEYS,
  geeConfig,
  getGeePrivateKey,
  hasGeePrivateKey,
  validateGeeConfig,
  type GeeConfigValidation,
} from "@/config/gee.config";

export class GeeCredentialsRepository {
  getClientEmail(): string {
    return geeConfig.clientEmail;
  }

  getGoogleProjectId(): string {
    return geeConfig.googleProjectId;
  }

  getEarthEngineProjectId(): string {
    return geeConfig.earthEngineProjectId;
  }

  getPrivateKey(): string {
    return getGeePrivateKey();
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

  validateEnvironment(): GeeConfigValidation {
    return validateGeeConfig();
  }
}

export const geeCredentialsRepository = new GeeCredentialsRepository();
