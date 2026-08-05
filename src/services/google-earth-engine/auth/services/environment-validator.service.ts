/**
 * EnvironmentValidator — validación automática de variables .env (Sprint 2)
 */

import type { IEnvironmentValidator } from "../interfaces";
import type { EnvironmentValidationResult } from "../types/auth.types";
import type { GeeCredentialsRepository } from "../repositories/gee-credentials.repository";

export class EnvironmentValidator implements IEnvironmentValidator {
  constructor(private readonly credentialsRepository: GeeCredentialsRepository) {}

  validate(): EnvironmentValidationResult {
    const result = this.credentialsRepository.validateEnvironment();

    return {
      isValid: result.isValid,
      missingVariables: result.missingVariables,
      errors: result.errors,
      warnings: result.warnings,
      message: result.message,
    };
  }

  getMissingVariables(): string[] {
    return this.validate().missingVariables;
  }

  isValid(): boolean {
    return this.validate().isValid;
  }
}
