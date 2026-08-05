/**
 * Colección satelital — Sprint 3
 */

import type { SatellitePlatform } from "../types/satellite-explorer.types";
import type { SatelliteMetadata } from "./satellite-metadata.interface";

export interface SatelliteCollection {
  id: string;
  platform: SatellitePlatform;
  name: string;
  description: string;
  metadata: SatelliteMetadata;
  isActive: boolean;
  comingSoon?: boolean;
}
