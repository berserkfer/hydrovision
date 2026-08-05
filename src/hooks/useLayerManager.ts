"use client";

import { useCallback, useMemo, useState } from "react";
import type { LayerManagerSnapshot, ManagedLayer } from "@/types/layers";
import { createLayerManager, type LayerManager } from "@/services/layers";

interface UseLayerManagerResult {
  snapshot: LayerManagerSnapshot;
  layers: ManagedLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  resetLayers: () => void;
  manager: LayerManager;
}

export function useLayerManager(): UseLayerManagerResult {
  const [manager] = useState(() => createLayerManager());
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const layers = useMemo(() => {
    void version;
    return manager.getLayers();
  }, [manager, version]);

  const snapshot = useMemo(() => {
    void version;
    return manager.getSnapshot();
  }, [manager, version]);

  const toggleLayer = useCallback(
    (layerId: string) => {
      manager.toggleLayer(layerId);
      bump();
    },
    [manager, bump]
  );

  const setLayerVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      manager.setLayerVisibility(layerId, visible);
      bump();
    },
    [manager, bump]
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      manager.setLayerOpacity(layerId, opacity);
      bump();
    },
    [manager, bump]
  );

  const resetLayers = useCallback(() => {
    manager.resetLayers();
    bump();
  }, [manager, bump]);

  return {
    snapshot,
    layers,
    toggleLayer,
    setLayerVisibility,
    setLayerOpacity,
    resetLayers,
    manager,
  };
}
