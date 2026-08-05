/**
 * Factory Pattern — creación del proveedor GEE (Sprint 2)
 */

import { getEarthEngineAuthService } from "./auth";
import type { IGEEProvider } from "./interfaces";
import type { GeeProviderMode } from "./types/gee.types";
import { geeConfigRepository } from "./repositories";
import { MockGeeProvider, ServiceAccountGeeProvider } from "./providers";

export class GeeFactory {
  static create(mode: GeeProviderMode = "mock"): IGEEProvider {
    switch (mode) {
      case "service_account": {
        const authService = getEarthEngineAuthService();
        return new ServiceAccountGeeProvider(geeConfigRepository, authService);
      }
      case "user":
        return new MockGeeProvider(geeConfigRepository);
      case "mock":
      default:
        return new MockGeeProvider(geeConfigRepository);
    }
  }

  static createAuto(): IGEEProvider {
    const validation = geeConfigRepository.validate();
    return validation.isValid
      ? GeeFactory.create("service_account")
      : GeeFactory.create("mock");
  }

  static getSupportedModes(): GeeProviderMode[] {
    return ["mock", "service_account", "user"];
  }
}
