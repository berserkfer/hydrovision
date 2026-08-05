/**
 * IndexRepository — acceso a reflectancias e históricos (Sprint 4)
 */

import type { IndexCode } from "../types/index-engine.types";

export interface IndexRepository {
  getStoredValue(stationId: string, code: IndexCode): number | null;
  getPreviousValue(stationId: string, code: IndexCode, currentValue: number): number;
  getBandReflectance(stationId: string): Record<string, number>;
  getStationIdsForRiver(riverId: string): string[];
}
