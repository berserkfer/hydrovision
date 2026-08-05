"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createMuestra,
  deleteMuestra,
  getAllSampleSummaries,
  getSampleStats,
  updateMuestra,
} from "@/lib/repositories/sample.repository";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pagination = usePagination({ totalItems: samples.length, pageSize });
  const paginatedSamples = useMemo(
    () => pagination.paginate(samples),
    [samples, pagination]
  );

  const refresh = useCallback(
    (filterCampanaId?: string) => {
      const id = filterCampanaId ?? campanaId;
      setSamples(getAllSampleSummaries(id || undefined));
      setStats(getSampleStats(id || undefined));
    },
    [campanaId]
  );

  const selectCampana = useCallback(
    (id: string) => {
      setCampanaId(id);
      pagination.resetPage();
      setSamples(getAllSampleSummaries(id || undefined));
      setStats(getSampleStats(id || undefined));
    },
    [pagination.resetPage]
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const registerSample = useCallback(
    (payload: CreateMuestraPayload) => {
      const result = createMuestra(payload);
      if (result.success) {
        refresh();
        pagination.resetPage();
        showToast(result.message);
      }
      return result;
    },
    [refresh, pagination.resetPage, showToast]
  );

  const editSample = useCallback(
    (id: string, payload: CreateMuestraPayload) => {
      const result = updateMuestra(id, payload);
      if (result.success) {
        refresh();
        showToast(result.message);
      }
      return result;
    },
    [refresh, showToast]
  );

  const removeSample = useCallback(
    (id: string) => {
      const result = deleteMuestra(id);
      if (result.success) {
        refresh();
        pagination.resetPage();
        showToast(result.message);
      }
      return result;
    },
    [refresh, pagination.resetPage, showToast]
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
    toastMessage,
    dismissToast,
  };
}
