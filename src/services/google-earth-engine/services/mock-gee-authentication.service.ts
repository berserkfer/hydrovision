/**
 * Autenticación GEE simulada — Sprint 1 (sin OAuth ni service account real)
 */

import type { GEEAuthentication } from "../interfaces";
import type { GeeConfigRepository } from "../repositories/gee-config.repository";

export class MockGeeAuthenticationService implements GEEAuthentication {
  constructor(private readonly configRepository: GeeConfigRepository) {}

  isConfigured(): boolean {
    return this.configRepository.validate().isValid;
  }

  async isAuthenticated(): Promise<boolean> {
    return false;
  }

  getConfigurationErrors(): string[] {
    return this.configRepository.validate().errors;
  }

  getSetupSteps(): string[] {
    return [
      "Registrar proyecto en Google Cloud Console",
      "Habilitar Earth Engine API para el proyecto",
      "Crear cuenta de servicio con rol Earth Engine Resource Admin",
      "Descargar JSON de credenciales y mapear a variables de entorno",
      "Completar GOOGLE_EARTH_ENGINE_PROJECT, GOOGLE_CLIENT_EMAIL, GOOGLE_SERVICE_ACCOUNT y GOOGLE_PRIVATE_KEY",
      "Ejecutar health check: npm run test:gee",
      "Sprint 2: implementar autenticación service account sin exponer secretos al cliente",
    ];
  }
}
