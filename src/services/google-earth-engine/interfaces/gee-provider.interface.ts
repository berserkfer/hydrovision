/**
 * Proveedor agregado GEE — fachada principal (SOLID / DI)
 */

import type { GEEAuthentication } from "./gee-authentication.interface";
import type { GEEExportService } from "./gee-export.service.interface";
import type { GEEImageService } from "./gee-image.service.interface";
import type { GEEIndexService } from "./gee-index.service.interface";
import type { GeeProviderMode, GeeProviderStatus } from "../types/gee.types";

export interface IGEEProvider {
  readonly id: string;
  readonly mode: GeeProviderMode;

  authentication: GEEAuthentication;
  images: GEEImageService;
  indices: GEEIndexService;
  exports: GEEExportService;

  isAvailable(): boolean;
  getStatus(): GeeProviderStatus;
}
