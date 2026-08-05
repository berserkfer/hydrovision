/**
 * Contrato de autenticación GEE — Sprint 1 (sin implementación real)
 */

export interface GEEAuthentication {
  /** Indica si las variables de entorno requeridas están presentes */
  isConfigured(): boolean;

  /** Verifica autenticación contra GEE (stub en Sprint 1) */
  isAuthenticated(): Promise<boolean>;

  /** Errores de configuración legibles para operadores */
  getConfigurationErrors(): string[];

  /** Guía de configuración para despliegue */
  getSetupSteps(): string[];
}
