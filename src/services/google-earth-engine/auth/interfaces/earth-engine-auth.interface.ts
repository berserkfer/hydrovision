/**
 * Contrato de autenticación Earth Engine — Sprint 2
 */

import type {
  AuthConnectionTestResult,
  EarthEngineAuthStatus,
} from "../types/auth.types";

export interface IEarthEngineAuth {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  getStatus(): EarthEngineAuthStatus;
  testConnection(): Promise<AuthConnectionTestResult>;
}
