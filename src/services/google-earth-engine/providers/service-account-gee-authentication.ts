/**
 * Adaptador GEEAuthentication → EarthEngineAuthService (Sprint 2)
 */

import type { GEEAuthentication } from "../interfaces";
import type { EarthEngineAuthService } from "../auth/services/earth-engine-auth.service";
import type { GeeConfigRepository } from "../repositories/gee-config.repository";

export class ServiceAccountGeeAuthentication implements GEEAuthentication {
  constructor(
    private readonly authService: EarthEngineAuthService,
    private readonly configRepository: GeeConfigRepository
  ) {}

  isConfigured(): boolean {
    return this.authService.getStatus().isConfigured;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authService.isInitialized();
  }

  getConfigurationErrors(): string[] {
    const validation = this.configRepository.validate();
    return validation.isValid ? [] : validation.errors;
  }

  getSetupSteps(): string[] {
    return [
      "Completar GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID y GOOGLE_EARTH_ENGINE_PROJECT",
      "Ejecutar diagnóstico en /admin/system-status",
      "Usar 'Probar Conexión' para inicializar autenticación simulada",
      "Sprint 3: reemplazar token simulado por OAuth2 real",
    ];
  }
}
