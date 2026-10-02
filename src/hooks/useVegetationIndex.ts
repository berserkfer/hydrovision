"use client";

import { useCallback, useEffect, useState } from "react";
import type { VegetationZoneId } from "@/vegetation/config/vegetation-zones.config";
import type { VegetationIndexResult } from "@/vegetation/vegetation-index.service";
import type { LagoonAlertResult } from "@/vegetation/lagoon-alert.service";
import type { NdviVigorInterpretation } from "@/vegetation/ndvi-interpretation";

interface VegetationApiResponse extends VegetationIndexResult {
  alert?: LagoonAlertResult;
  interpretation?: NdviVigorInterpretation | null;
}

interface UseVegetationIndexOptions {
  /** Solo aplica a la zona de la laguna (NDCI). */
  threshold?: number;
}

export function useVegetationIndex(zoneId: VegetationZoneId, options?: UseVegetationIndexOptions) {
  const [data, setData] = useState<VegetationApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const threshold = options?.threshold;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        zone: zoneId,
        date: new Date().toISOString(),
      });
      if (threshold != null) params.set("threshold", String(threshold));

      const res = await fetch(`/api/vegetation?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al consultar el índice de vegetación");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [zoneId, threshold]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
