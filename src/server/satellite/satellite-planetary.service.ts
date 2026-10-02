/**
 * Servicio de consulta Microsoft Planetary Computer → SatelliteObservation.
 * Sin token/auth — mirror simplificado de satellite-copernicus.service.ts.
 */

import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { planetaryAdapter } from "@/server/planetary/planetary.adapter";
import type { SatelliteObservation, SatelliteScene } from "@/satellite/types/satellite-observation.types";
import type { SatelliteQueryFilters } from "./satellite.types";
import { buildSatelliteObservationFromPlanetary } from "./satellite-observation.builder";
import { mapObservationToScene } from "./satellite.mappers";
import { resolveStationCoordinates } from "./station-coordinates.resolver";

function defaultDateRange(filters?: SatelliteQueryFilters): { startDate: string; endDate: string } {
  const end = filters?.fechaFin ?? new Date().toISOString().slice(0, 10);
  const start =
    filters?.fechaInicio ??
    new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
  return { startDate: start, endDate: end };
}

export class SatellitePlanetaryService {
  isEnabled(): boolean {
    return isPlanetaryComputerEnabled();
  }

  async getPlanetaryStatus() {
    return planetaryAdapter.getStatus();
  }

  /** Siempre "en vivo" si está habilitado — no hay token que pueda estar "simulado" */
  async isLiveConnected(): Promise<boolean> {
    return this.isEnabled();
  }

  async queryObservationsFromPlanetary(
    filters?: SatelliteQueryFilters
  ): Promise<SatelliteObservation[]> {
    if (!this.isEnabled() || !filters?.stationId) {
      return [];
    }

    const coords = await resolveStationCoordinates(filters.stationId);
    if (!coords) return [];

    const { startDate, endDate } = defaultDateRange(filters);

    const scenes = await planetaryAdapter.searchSentinel2Scenes({
      latitude: coords.latitude,
      longitude: coords.longitude,
      startDate,
      endDate,
      cloudCoverMax: 30,
      limit: 5,
    });

    if (scenes.length === 0) return [];

    // Cada escena es una consulta independiente (su propia búsqueda de reflectancia) —
    // resolverlas en paralelo en vez de una a una recorta drásticamente la latencia total,
    // sin cambiar el resultado (mismo conjunto de escenas, mismo orden).
    const reflectanceResults = await Promise.all(
      scenes.slice(0, 3).map((scene) =>
        planetaryAdapter
          .getReflectanceAtPoint({
            latitude: coords.latitude,
            longitude: coords.longitude,
            startDate,
            endDate,
            sceneId: scene.sceneId,
            cloudCoverMax: 30,
            sceneCloudPercentage: scene.cloudPercentage,
            sceneSystemTimeStart: scene.systemTimeStart,
          })
          .then((reflectance) => ({ scene, reflectance }))
      )
    );

    const observations: SatelliteObservation[] = [];
    for (const { scene, reflectance } of reflectanceResults) {
      if (!reflectance || reflectance.reflectanceSemanticStatus !== "valid") continue;

      observations.push(
        buildSatelliteObservationFromPlanetary({
          stationId: filters.stationId,
          scene,
          reflectance,
          isSimulated: false, // dato real siempre que llega hasta aquí — nunca hay fallback simulado
        })
      );
    }

    return observations;
  }

  async queryScenesFromPlanetary(filters?: SatelliteQueryFilters): Promise<SatelliteScene[]> {
    const observations = await this.queryObservationsFromPlanetary(filters);
    return observations.map(mapObservationToScene);
  }
}

export const satellitePlanetaryService = new SatellitePlanetaryService();
