/**
 * Health Check GEE — Sprint 1
 */

import type { GeeHealthCheckResult, GeeHealthStatus } from "../types/gee.types";
import type { GeeConfigRepository } from "../repositories/gee-config.repository";
import type { IGEEProvider } from "../interfaces";

export class GeeHealthService {
  constructor(
    private readonly configRepository: GeeConfigRepository,
    private readonly provider: IGEEProvider
  ) {}

  check(): GeeHealthCheckResult {
    const validation = this.configRepository.validate();
    const providerStatus = this.provider.getStatus();

    const status = this.resolveStatus(validation.isValid, providerStatus.isAvailable);

    return {
      status,
      configuration: {
        isValid: validation.isValid,
        missingVariables: validation.missingVariables,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      provider: providerStatus,
      checkedAt: new Date().toISOString(),
    };
  }

  formatReport(result: GeeHealthCheckResult): string {
    const lines = [
      "=== HydroVision · Google Earth Engine Health Check ===",
      `Estado general: ${result.status.toUpperCase()}`,
      `Verificado: ${result.checkedAt}`,
      "",
      "Configuración:",
      result.configuration.isValid
        ? "  ✓ Variables de entorno completas"
        : "  ✗ Configuración incompleta",
    ];

    if (result.configuration.missingVariables.length > 0) {
      lines.push("  Variables faltantes:");
      for (const variable of result.configuration.missingVariables) {
        lines.push(`    - ${variable}`);
      }
    }

    for (const error of result.configuration.errors) {
      lines.push(`  Error: ${error}`);
    }

    for (const warning of result.configuration.warnings) {
      lines.push(`  Aviso: ${warning}`);
    }

    lines.push(
      "",
      "Proveedor:",
      `  ID: ${result.provider.id}`,
      `  Modo: ${result.provider.mode}`,
      `  Disponible: ${result.provider.isAvailable ? "sí" : "no"}`,
      `  Configurado: ${result.provider.isConfigured ? "sí" : "no"}`,
      `  Mensaje: ${result.provider.message}`
    );

    return lines.join("\n");
  }

  private resolveStatus(isConfigValid: boolean, isProviderAvailable: boolean): GeeHealthStatus {
    if (isConfigValid && isProviderAvailable) {
      return "healthy";
    }

    if (!isConfigValid) {
      return "unconfigured";
    }

    return "degraded";
  }
}
