/**
 * IndexService — fachada del motor de índices (Sprint 4)
 */

import type { IndexEngineSnapshot } from "../types/index-engine.types";

export interface IndexService {
  getSnapshotForStation(stationId: string, riverId: string): IndexEngineSnapshot;
  getSnapshotForRiver(riverId: string): IndexEngineSnapshot;
}
