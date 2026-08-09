"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createSample,
  deleteSample,
  fetchSamplesList,
  updateSample,
} from "@/lib/api/samples.client";
import { withApiToast } from "@/lib/api/notify";
import type { CreateMuestraPayload } from "@/types/sampling";
import type { MuestraSummary, SampleStats } from "@/types/sampling";
import { usePagination } from "./usePagination";

interface UseSamplesOptions {
  initialSamples: MuestraSummary[];
  initialStats: SampleStats;
  initialCampanaId?: string;
  pageSize?: number;
}

export function useSamples({
  initialSamples,
  initialStats,
  initialCampanaId = "",
  pageSize = 8,
}: UseSamplesOptions) {
  const [samples, setSamples] = useState(initialSamples);
  const [stats, setStats] = useState(initialStats);
  const [campanaId, setCampanaId] = useState(initialCampanaId);

  const pagination = usePagination({ totalItems: samples.length, pageSize });
  const paginatedSamples = useMemo(
    () => pagination.paginate(samples),
    [samples, pagination]
  );

  const refresh = useCallback(async (filterCampanaId?: string) => {
    const id = filterCampanaId ?? campanaId;
    const data = await fetchSamplesList({
      pageSize: 500,
      ...(id ? { campanaId: id } : {}),
    });
    setSamples(data.items);
    setStats(data.stats);
  }, [campanaId]);

  const selectCampana = useCallback(
    async (id: string) => {
      setCampanaId(id);
      pagination.resetPage();
      const data = await fetchSamplesList({
        pageSize: 500,
        ...(id ? { campanaId: id } : {}),
      });
      setSamples(data.items);
      setStats(data.stats);
    },
    [pagination]
  );

  const registerSample = useCallback(
    async (payload: CreateMuestraPayload) => {
      const result = await withApiToast(() => createSample(payload), {
        success: "Muestra registrada correctamente",
        error: "No se pudo registrar la muestra",
      });
      if (result?.success) {
        await refresh();
        pagination.resetPage();
      }
      return result;
    },
    [refresh, pagination]
  );

  const editSample = useCallback(
    async (id: string, payload: CreateMuestraPayload) => {
      const result = await withApiToast(() => updateSample(id, payload), {
        success: "Muestra actualizada correctamente",
        error: "No se pudo actualizar la muestra",
      });
      if (result?.success) await refresh();
      return result;
    },
    [refresh]
  );

  const removeSample = useCallback(
    async (id: string) => {
      const result = await withApiToast(() => deleteSample(id), {
        success: "Muestra eliminada correctamente",
        error: "No se pudo eliminar la muestra",
      });
      if (result) {
        await refresh();
        pagination.resetPage();
      }
      return result;
    },
    [refresh, pagination]
  );

  return {
    samples: paginatedSamples,
    allSamples: samples,
    stats,
    campanaId,
    selectCampana,
    registerSample,
    editSample,
    removeSample,
    pagination,
  };
}
