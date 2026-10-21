"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JobState, StoredResult } from "@/server/jobs/background-jobs";

interface JobPayload<T> {
  state: JobState;
  latest: StoredResult<T> | null;
  /** Columnas separadas de imágenes propias por punto, si la API las envía. */
  ownImages?: Record<string, { count: number; latest: string | null }>;
}

/**
 * Lee el último resultado guardado de un trabajo en segundo plano (sin calcular nada) y,
 * mientras haya un cálculo en curso, consulta su estado cada 3 s.
 */
export function useBackgroundJob<T>(url: string) {
  const [data, setData] = useState<JobPayload<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(url);
      const body = (await response.json()) as { data?: JobPayload<T>; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? `Error ${response.status}`);
      setData(body.data);
      setError(null);
      return body.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el resultado.");
      return null;
    }
  }, [url]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Sondeo solo mientras el cálculo está en curso.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (data?.state.status === "running") {
      timer.current = setTimeout(() => void refresh(), 3000);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, refresh]);

  const start = useCallback(
    async (body: Record<string, unknown> = {}) => {
      setStarting(true);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message ?? `Error ${response.status}`);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar el cálculo.");
      } finally {
        setStarting(false);
      }
    },
    [url, refresh]
  );

  return {
    state: data?.state ?? null,
    latest: data?.latest ?? null,
    ownImages: data?.ownImages ?? {},
    error,
    starting,
    start,
    refresh,
  };
}
