"use client";

import { useMemo } from "react";
import { getIndexService, type IndexEngineSnapshot } from "@/services/satellite-index-engine";
import { ALL_STATIONS_VALUE } from "@/types/geography";

export function useSatelliteIndexEngine(riverId: string, stationId: string | null): IndexEngineSnapshot {
  return useMemo(() => {
    const service = getIndexService();

    if (stationId && stationId !== ALL_STATIONS_VALUE) {
      return service.getSnapshotForStation(stationId, riverId);
    }

    return service.getSnapshotForRiver(riverId);
  }, [riverId, stationId]);
}
