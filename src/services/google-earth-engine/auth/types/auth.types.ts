/**
 * Tipos de autenticación GEE — Sprint 2
 */

export type AuthSemaphoreStatus = "green" | "yellow" | "red";

export interface EnvironmentValidationResult {
  isValid: boolean;
  missingVariables: string[];
  errors: string[];
  warnings: string[];
  message: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  errors: string[];
  message: string;
}

export interface EarthEngineAuthStatus {
  isInitialized: boolean;
  isConfigured: boolean;
  configurationMessage: string;
  authMode: "simulated" | "service_account";
  lastCheckedAt: string | null;
}

export interface AuthConnectionTestResult {
  success: boolean;
  simulated: boolean;
  message: string;
  testedAt: string;
  tokenPreview?: string;
  errors?: string[];
}

export interface GeeAccessToken {
  value: string;
  expiresAt: string;
  source: "simulated" | "google_oauth";
}

export interface SystemStatusSection {
  id: string;
  label: string;
  status: AuthSemaphoreStatus;
  message: string;
  details: string[];
}

export interface SystemStatusSnapshot {
  overall: AuthSemaphoreStatus;
  checkedAt: string;
  sections: SystemStatusSection[];
  configurationValid: boolean;
}
