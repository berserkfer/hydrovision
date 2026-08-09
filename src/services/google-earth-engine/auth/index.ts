/**
 * Auth module DI — Sprint 2
 */

import { geeCredentialsRepository } from "./repositories";
import {
  CredentialValidator,
  EarthEngineAuthService,
  EarthEngineTokenManager,
  EnvironmentValidator,
} from "./services";

let authService: EarthEngineAuthService | null = null;
let tokenManager: EarthEngineTokenManager | null = null;
let environmentValidator: EnvironmentValidator | null = null;
let credentialValidator: CredentialValidator | null = null;

function createAuthStack(): {
  authService: EarthEngineAuthService;
  tokenManager: EarthEngineTokenManager;
  environmentValidator: EnvironmentValidator;
  credentialValidator: CredentialValidator;
} {
  const envValidator = new EnvironmentValidator(geeCredentialsRepository);
  const credValidator = new CredentialValidator(geeCredentialsRepository);

  // eslint-disable-next-line prefer-const -- asignación posterior por dependencia circular con tokenManager
  let service: EarthEngineAuthService;
  const tokens = new EarthEngineTokenManager(() => service.isInitialized());
  service = new EarthEngineAuthService(envValidator, credValidator, tokens);

  return {
    authService: service,
    tokenManager: tokens,
    environmentValidator: envValidator,
    credentialValidator: credValidator,
  };
}

export function getEarthEngineAuthService(): EarthEngineAuthService {
  if (!authService) {
    const stack = createAuthStack();
    authService = stack.authService;
    tokenManager = stack.tokenManager;
    environmentValidator = stack.environmentValidator;
    credentialValidator = stack.credentialValidator;
  }
  return authService;
}

export function getEarthEngineTokenManager(): EarthEngineTokenManager {
  getEarthEngineAuthService();
  return tokenManager as EarthEngineTokenManager;
}

export function getEnvironmentValidator(): EnvironmentValidator {
  getEarthEngineAuthService();
  return environmentValidator as EnvironmentValidator;
}

export function getCredentialValidator(): CredentialValidator {
  getEarthEngineAuthService();
  return credentialValidator as CredentialValidator;
}

export function resetEarthEngineAuth(): void {
  authService = null;
  tokenManager = null;
  environmentValidator = null;
  credentialValidator = null;
}

export * from "./interfaces";
export * from "./types/auth.types";
export { geeCredentialsRepository } from "./repositories";
export {
  CredentialValidator,
  EarthEngineAuthService,
  EarthEngineAuthInitError,
  EarthEngineTokenManager,
  EnvironmentValidator,
} from "./services";
