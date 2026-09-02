/**
 * SatelliteRepository — contrato de persistencia satelital (mock / Prisma).
 * NO llama a GEE ni APIs externas.
 */

import type { SatelliteQueryFilters } from "./satellite.types";
import type { SatelliteObservation, SatelliteScene } from "@/satellite/types/satellite-observation.types";

export interface SatelliteRepository {
  getDataSource(): "database" | "mock";
  findObservations(filters?: SatelliteQueryFilters): Promise<SatelliteObservation[]>;
  findObservationById(id: string): Promise<SatelliteObservation | null>;
  findScenes(filters?: SatelliteQueryFilters): Promise<SatelliteScene[]>;
}
