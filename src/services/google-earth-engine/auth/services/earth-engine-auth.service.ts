/**
 * EarthEngineAuthService — autenticación Service Account (Sprint 2)
 * Sprint 2: validación + token simulado. Sprint 3: OAuth2 real contra Google.
 */

import type { IEarthEngineAuth } from "../interfaces";
import type {
  AuthConnectionTestResult,
  EarthEngineAuthStatus,
} from "../types/auth.types";
import type { CredentialValidator } from "./credential-validator.service";
import type { EarthEngineTokenManager } from "./earth-engine-token-manager";
import type { EnvironmentValidator } from "./environment-validator.service";

export class EarthEngineAuthInitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EarthEngineAuthInitError";
  }
}

export class EarthEngineAuthService implements IEarthEngineAuth {
  private initialized = false;
  private lastCheckedAt: string | null = null;

  constructor(
    private readonly environmentValidator: EnvironmentValidator,
    private readonly credentialValidator: CredentialValidator,
    private readonly tokenManager: EarthEngineTokenManager
  ) {}

  async initialize(): Promise<void> {
    const environmentResult = this.environmentValidator.validate();

    if (!environmentResult.isValid) {
      throw new EarthEngineAuthInitError(
        [environmentResult.message, ...environmentResult.errors].join("\n")
      );
    }

    const credentialResult = this.credentialValidator.validate();

    if (!credentialResult.isValid) {
      throw new EarthEngineAuthInitError(
        [credentialResult.message, ...credentialResult.errors].join("\n")
      );
    }

    this.initialized = true;
    this.lastCheckedAt = new Date().toISOString();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getStatus(): EarthEngineAuthStatus {
    const environmentResult = this.environmentValidator.validate();
    const credentialResult = this.credentialValidator.validate();
    const isConfigured = environmentResult.isValid && credentialResult.isValid;

    let configurationMessage = environmentResult.message;

    if (environmentResult.isValid && !credentialResult.isValid) {
      configurationMessage = credentialResult.message;
    }

    if (isConfigured) {
      configurationMessage = "✅ Configuración válida";
    }

    return {
      isInitialized: this.initialized,
      isConfigured,
      configurationMessage,
      authMode: "simulated",
      lastCheckedAt: this.lastCheckedAt,
    };
  }

  async testConnection(): Promise<AuthConnectionTestResult> {
    const testedAt = new Date().toISOString();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      const token = await this.tokenManager.getAccessToken();

      this.lastCheckedAt = testedAt;

      return {
        success: true,
        simulated: true,
        message:
          "✅ Configuración válida. Conexión simulada exitosa — listo para OAuth2 real (Sprint 3).",
        testedAt,
        tokenPreview: `${token.value.slice(0, 24)}…`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido al probar conexión GEE.";

      return {
        success: false,
        simulated: true,
        message,
        testedAt,
        errors: message.split("\n"),
      };
    }
  }
}
