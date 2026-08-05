/**
 * Contrato de validación de entorno — Sprint 2
 */

import type { EnvironmentValidationResult } from "../types/auth.types";

export interface IEnvironmentValidator {
  validate(): EnvironmentValidationResult;
  getMissingVariables(): string[];
  isValid(): boolean;
}
