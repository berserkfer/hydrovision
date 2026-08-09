/**
 * Resultado de validación — Sprint 3C
 */

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validationSuccess(): ValidationResult {
  return { valid: true, issues: [] };
}

export function validationFailure(issues: ValidationIssue[]): ValidationResult {
  return { valid: false, issues };
}
