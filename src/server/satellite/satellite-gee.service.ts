/**
 * Servicio de consulta GEE → SatelliteObservation.
 * Orquesta adaptador GEE + builder HydroVision (índices).
 */

import { prisma } from "@/server/db";
import { getDataStore } from "@/data/store-access";
import { isSatelliteDatabaseEnabled } from "@/config/satellite-data-source.config";
import { isGeeIntegrationEnabled, isGeeLiveToken } from "@/config/gee-integration.config";
import { getEarthEngineAuthService, getEarthEngineTokenManager } from "@/services/google-earth-engine/auth";
import { GeeAdapter } from "@/server/gee/gee.adapter";
import type { SatelliteObservation, SatelliteScene } from "@/satellite/types/satellite-observation.types";
import type { SatelliteQueryFilters } from "./satellite.types";
import { buildSatelliteObservationFromGee } from "./satellite-observation.builder";
import { mapObservationToScene } from "./satellite.mappers";

export interface StationCoordinates {
  id: string;
  latitude: number;
  longitude: number;
}

async function resolveStationCoordinates(stationId: string): Promise<StationCoordinates | null> {
  if (isSatelliteDatabaseEnabled()) {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { id: true, latitude: true, longitude: true },
    });
    if (!station) return null;
    return { id: station.id, latitude: station.latitude, longitude: station.longitude };
  }

  const station = getDataStore().estaciones.find((e) => e.id === stationId);
  if (!station) return null;
  return {
    id: station.id,
    latitude: station.coordenadas.latitude,
    longitude: station.coordenadas.longitude,
  };
}

function defaultDateRange(filters?: SatelliteQueryFilters): { startDate: string; endDate: string } {
  const end = filters?.fechaFin ?? new Date().toISOString().slice(0, 10);
  const start =
    filters?.fechaInicio ??
    new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  return { startDate: start, endDate: end };
}

let geeAdapterSingleton: GeeAdapter | null = null;

function getGeeAdapter(): GeeAdapter {
  if (!geeAdapterSingleton) {
    const authService = getEarthEngineAuthService();
    geeAdapterSingleton = new GeeAdapter(
      getEarthEngineTokenManager(),
      undefined,
      () => authService.isInitialized() || isGeeIntegrationEnabled()
    );
  }
  return geeAdapterSingleton;
}

export function resetGeeAdapterForTests(): void {
  geeAdapterSingleton = null;
}

export class SatelliteGeeService {
  isEnabled(): boolean {
    return isGeeIntegrationEnabled();
  }

  async getGeeStatus() {
    return getGeeAdapter().getStatus();
  }

  async isLiveConnected(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      const auth = getEarthEngineAuthService();
      if (!auth.isInitialized()) {
        await auth.initialize();
      }
      const token = await getEarthEngineTokenManager().getAccessToken();
      return isGeeLiveToken(token.source);
    } catch {
      return false;
    }
  }

  async queryObservationsFromGee(
    filters?: SatelliteQueryFilters
  ): Promise<SatelliteObservation[]> {
    if (!this.isEnabled() || !filters?.stationId) {
      return [];
    }

    const coords = await resolveStationCoordinates(filters.stationId);
    if (!coords) return [];

    const auth = getEarthEngineAuthService();
    if (!auth.isInitialized()) {
      try {
        await auth.initialize();
      } catch {
        return [];
      }
    }

    const adapter = getGeeAdapter();
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

    const token = await getEarthEngineTokenManager().getAccessToken();
    const isSimulated = !isGeeLiveToken(token.source);

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
        buildSatelliteObservationFromGee({
          stationId: filters.stationId,
          scene,
          reflectance,
          isSimulated,
        })
      );
    }

    return observations;
  }

  async queryScenesFromGee(filters?: SatelliteQueryFilters): Promise<SatelliteScene[]> {
    const observations = await this.queryObservationsFromGee(filters);
    return observations.map(mapObservationToScene);
  }
}

export const satelliteGeeService = new SatelliteGeeService();
