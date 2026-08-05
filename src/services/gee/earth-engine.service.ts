/**
 * Google Earth Engine — contrato de servicio principal.
 * Fase 4: implementación real vía services/earth-engine/ (Python).
 */

import type {
  EarthEngineIndexRequest,
  EarthEngineIndexResponse,
} from "@/types";

export interface IEarthEngineService {
  readonly isConnected: boolean;
  fetchIndices(request: EarthEngineIndexRequest): Promise<EarthEngineIndexResponse>;
  getSetupGuide(): string[];
}

export class MockEarthEngineService implements IEarthEngineService {
  readonly isConnected = false;

  async fetchIndices(
    request: EarthEngineIndexRequest
  ): Promise<EarthEngineIndexResponse> {
    const { satelliteIndices } = await import("@/repositories/monitoring.repository");
    await new Promise((r) => setTimeout(r, 100));
    return {
      stationId: request.stationId,
      results: satelliteIndices.filter((s) => s.stationId === request.stationId),
      source: "simulated",
    };
  }

  getSetupGuide(): string[] {
    return [
      "Crear proyecto en Google Cloud Console",
      "Habilitar Earth Engine API y registrar aplicación",
      "Configurar credenciales de servicio en services/earth-engine/",
      "Definir región de interés (ROI) para cuenca del río Reque",
      "Implementar colecciones Landsat 8/9 y Sentinel-2",
      "Calcular NDWI, NDVI, MNDWI, NDTI y exportar a PostgreSQL",
    ];
  }
}

export const earthEngineService: IEarthEngineService = new MockEarthEngineService();
