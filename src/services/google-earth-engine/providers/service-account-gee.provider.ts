/**
 * Proveedor GEE con autenticación Service Account — Sprint 2
 */

import type { GEEAuthentication, IGEEProvider } from "../interfaces";
import type { EarthEngineAuthService } from "../auth/services/earth-engine-auth.service";
import type { GeeConfigRepository } from "../repositories/gee-config.repository";
import type { GeeProviderMode, GeeProviderStatus } from "../types/gee.types";
import {
  MockGeeExportService,
  MockGeeImageService,
  MockGeeIndexService,
} from "../services";
import { ServiceAccountGeeAuthentication } from "./service-account-gee-authentication";

export class ServiceAccountGeeProvider implements IGEEProvider {
  readonly id = "hydrovision-service-account-gee";
  readonly mode: GeeProviderMode = "service_account";
  readonly authentication: GEEAuthentication;
  readonly images = new MockGeeImageService();
  readonly indices = new MockGeeIndexService();
  readonly exports = new MockGeeExportService();

  constructor(
    configRepository: GeeConfigRepository,
    private readonly authService: EarthEngineAuthService
  ) {
    this.authentication = new ServiceAccountGeeAuthentication(authService, configRepository);
  }

  isAvailable(): boolean {
    return this.authService.getStatus().isConfigured;
  }

  getStatus(): GeeProviderStatus {
    const authStatus = this.authService.getStatus();

    return {
      id: this.id,
      mode: this.mode,
      isAvailable: this.isAvailable(),
      isConfigured: authStatus.isConfigured,
      message: authStatus.isInitialized
        ? "Proveedor Service Account inicializado (autenticación simulada)."
        : authStatus.isConfigured
          ? "Credenciales válidas. Use 'Probar Conexión' para inicializar."
          : "Configure las variables GOOGLE_* para habilitar Service Account.",
    };
  }
}
