/**
 * Servicio de consulta Copernicus Data Space Ecosystem → SatelliteObservation.
 * Orquesta CopernicusAdapter + builder HydroVision (índices) — mirror de satellite-gee.service.ts.
 */

import { isCopernicusIntegrationEnabled, isCopernicusLiveToken } from "@/config/copernicus-integration.config";
import { getCopernicusTokenManager } from "@/server/copernicus/copernicus-oauth.client";
import { CopernicusAdapter } from "@/server/copernicus/copernicus.adapter";
import type { SatelliteObservation, SatelliteScene } from "@/satellite/types/satellite-observation.types";
import type { SatelliteQueryFilters } from "./satellite.types";
import { buildSatelliteObservationFromCopernicus } from "./satellite-observation.builder";
import { mapObservationToScene } from "./satellite.mappers";
import { resolveStationCoordinates } from "./station-coordinates.resolver";

function defaultDateRange(filters?: SatelliteQueryFilters): { startDate: string; endDate: string } {
  const end = filters?.fechaFin ?? new Date().toISOString().slice(0, 10);
  const start =
    filters?.fechaInicio ??
    new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  return { startDate: start, endDate: end };
}

let copernicusAdapterSingleton: CopernicusAdapter | null = null;

function getCopernicusAdapter(): CopernicusAdapter {
  if (!copernicusAdapterSingleton) {
    copernicusAdapterSingleton = new CopernicusAdapter(
      getCopernicusTokenManager(),
      undefined,
      () => isCopernicusIntegrationEnabled()
    );
  }
  return copernicusAdapterSingleton;
}

export function resetCopernicusAdapterForTests(): void {
  copernicusAdapterSingleton = null;
}

export class SatelliteCopernicusService {
  isEnabled(): boolean {
    return isCopernicusIntegrationEnabled();
  }

  async getCopernicusStatus() {
    return getCopernicusAdapter().getStatus();
  }

  async isLiveConnected(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      const token = await getCopernicusTokenManager().getAccessToken();
      return isCopernicusLiveToken(token.source);
    } catch {
      return false;
    }
  }

  async queryObservationsFromCopernicus(
    filters?: SatelliteQueryFilters
  ): Promise<SatelliteObservation[]> {
    if (!this.isEnabled() || !filters?.stationId) {
      return [];
    }

    const coords = await resolveStationCoordinates(filters.stationId);
    if (!coords) return [];

    const adapter = getCopernicusAdapter();
    const { startDate, endDate } = defaultDateRange(filters);

    const scenes = await adapter.searchSentinel2Scenes({
      latitude: coords.latitude,
      longitude: coords.longitude,
      startDate,
      endDate,
      cloudCoverMax: 30,
      limit: 5,
    });

    if (scenes.length === 0) return [];

    const token = await getCopernicusTokenManager().getAccessToken();
    const isSimulated = !isCopernicusLiveToken(token.source);

    const observations: SatelliteObservation[] = [];

    for (const scene of scenes.slice(0, 3)) {
      const reflectance = await adapter.getReflectanceAtPoint({
        latitude: coords.latitude,
        longitude: coords.longitude,
        startDate,
        endDate,
        sceneId: scene.sceneId,
        cloudCoverMax: 30,
        sceneCloudPercentage: scene.cloudPercentage,
        sceneSystemTimeStart: scene.systemTimeStart,
      });

      if (!reflectance || reflectance.reflectanceSemanticStatus !== "valid") continue;

      observations.push(
        buildSatelliteObservationFromCopernicus({
          stationId: filters.stationId,
          scene,
          reflectance,
          isSimulated,
        })
      );
    }

    return observations;
  }

  async queryScenesFromCopernicus(filters?: SatelliteQueryFilters): Promise<SatelliteScene[]> {
    const observations = await this.queryObservationsFromCopernicus(filters);
    return observations.map(mapObservationToScene);
  }
}

export const satelliteCopernicusService = new SatelliteCopernicusService();
