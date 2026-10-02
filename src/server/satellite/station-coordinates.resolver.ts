/**
 * Resolución de coordenadas de estación — compartido por satellite-gee.service.ts
 * y satellite-copernicus.service.ts (mock vs Prisma vía isSatelliteDatabaseEnabled).
 */

import { prisma } from "@/server/db";
import { getDataStore } from "@/data/store-access";
import { isSatelliteDatabaseEnabled } from "@/config/satellite-data-source.config";

export interface StationCoordinates {
  id: string;
  latitude: number;
  longitude: number;
}

export async function resolveStationCoordinates(stationId: string): Promise<StationCoordinates | null> {
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
