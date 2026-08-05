/**
 * Metadatos de plataforma satelital — Sprint 3
 */

import type { SatellitePlatform } from "../types/satellite-explorer.types";

export interface SatelliteMetadata {
  platform: SatellitePlatform;
  displayName: string;
  spatialResolutionMeters: number;
  temporalResolutionDays: number;
  bands: string[];
  calculableIndices: string[];
  provider: string;
  collectionId: string;
}
