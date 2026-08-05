/**
 * Cliente legacy — re-exporta servicios GEE (Fase 3.4).
 * @deprecated Importar desde @/services/gee
 */

import { geeModuleConfig } from "@/config";
import { earthEngineService } from "@/services/gee";

export const EARTH_ENGINE_STATUS = {
  connected: geeModuleConfig.connected,
  message: geeModuleConfig.message,
};

export async function fetchSatelliteIndices(
  request: Parameters<typeof earthEngineService.fetchIndices>[0]
) {
  return earthEngineService.fetchIndices(request);
}

export function getEarthEngineSetupGuide(): string[] {
  return earthEngineService.getSetupGuide();
}

export {
  earthEngineService,
  satelliteImageRepository,
  mapLayerManager,
  indicesCalculator,
} from "@/services/gee";
