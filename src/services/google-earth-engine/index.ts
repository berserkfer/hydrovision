/**
 * Google Earth Engine — Sprint 1 + Sprint 2 Auth
 */

import { getEarthEngineAuthService, geeCredentialsRepository, resetEarthEngineAuth } from "./auth";
import { GeeFactory } from "./gee.factory";
import type { IGEEProvider } from "./interfaces";
import { geeConfigRepository } from "./repositories";
import { GeeHealthService, SystemStatusService } from "./services";

let activeProvider: IGEEProvider | null = null;
let activeHealthService: GeeHealthService | null = null;
let activeSystemStatusService: SystemStatusService | null = null;

export function getGeeProvider(): IGEEProvider {
  if (!activeProvider) {
    activeProvider = GeeFactory.createAuto();
  }
  return activeProvider;
}

export function setGeeProvider(provider: IGEEProvider): void {
  activeProvider = provider;
  activeHealthService = null;
  activeSystemStatusService = null;
}

export function resetGeeProvider(): void {
  activeProvider = null;
  activeHealthService = null;
  activeSystemStatusService = null;
  resetEarthEngineAuth();
}

export function getGeeHealthService(): GeeHealthService {
  if (!activeHealthService) {
    activeHealthService = new GeeHealthService(geeConfigRepository, getGeeProvider());
  }
  return activeHealthService;
}

export function getSystemStatusService(): SystemStatusService {
  if (!activeSystemStatusService) {
    activeSystemStatusService = new SystemStatusService(
      getEarthEngineAuthService(),
      geeCredentialsRepository,
      getGeeProvider()
    );
  }
  return activeSystemStatusService;
}

export { GeeFactory } from "./gee.factory";
export * from "./interfaces";
export * from "./types";
export { geeConfigRepository } from "./repositories";
export {
  GeeHealthService,
  MockGeeAuthenticationService,
  MockGeeExportService,
  MockGeeImageService,
  MockGeeIndexService,
  SystemStatusService,
} from "./services";
export { MockGeeProvider, ServiceAccountGeeProvider } from "./providers";
export {
  getEarthEngineAuthService,
  getEarthEngineTokenManager,
  getEnvironmentValidator,
  getCredentialValidator,
  geeCredentialsRepository,
  EarthEngineAuthService,
  EarthEngineAuthInitError,
  EarthEngineTokenManager,
  EnvironmentValidator,
  CredentialValidator,
} from "./auth";
export type {
  IEarthEngineAuth,
  IEnvironmentValidator,
  ITokenProvider,
} from "./auth";
