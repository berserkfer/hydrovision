/**
 * Proveedor GEE simulado — implementación Mock de IGEEProvider
 */

import type { IGEEProvider } from "../interfaces";
import type { GeeProviderMode, GeeProviderStatus } from "../types/gee.types";
import type { GeeConfigRepository } from "../repositories/gee-config.repository";
import {
  MockGeeAuthenticationService,
  MockGeeExportService,
  MockGeeImageService,
  MockGeeIndexService,
} from "../services";

export class MockGeeProvider implements IGEEProvider {
  readonly id = "hydrovision-mock-gee";
  readonly mode: GeeProviderMode = "mock";

  readonly authentication: MockGeeAuthenticationService;
  readonly images: MockGeeImageService;
  readonly indices: MockGeeIndexService;
  readonly exports: MockGeeExportService;

  constructor(private readonly configRepository: GeeConfigRepository) {
    this.authentication = new MockGeeAuthenticationService(configRepository);
    this.images = new MockGeeImageService();
    this.indices = new MockGeeIndexService();
    this.exports = new MockGeeExportService();
  }

  isAvailable(): boolean {
    return true;
  }

  getStatus(): GeeProviderStatus {
    const isConfigured = this.authentication.isConfigured();

    return {
      id: this.id,
      mode: this.mode,
      isAvailable: this.isAvailable(),
      isConfigured,
      message: isConfigured
        ? "Proveedor simulado activo. Credenciales detectadas; autenticación real pendiente (Sprint 2)."
        : "Proveedor simulado activo. Complete las variables GEE en .env para preparar autenticación.",
    };
  }
}
