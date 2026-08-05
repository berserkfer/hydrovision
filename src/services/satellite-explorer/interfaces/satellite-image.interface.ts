/**
 * Imagen satelital del explorador — Sprint 3
 */

import type { SatelliteImageStatus, SatellitePlatform } from "../types/satellite-explorer.types";

export interface SatelliteImage {
  id: string;
  platform: SatellitePlatform;
  acquiredAt: string;
  cloudCoverPercent: number;
  status: SatelliteImageStatus;
  thumbnailUrl: string;
  previewUrl: string;
  tileUrl?: string;
  bounds: {
    southWest: [number, number];
    northEast: [number, number];
  };
  watershedId: string;
  riverId: string;
  stationId: string;
}
