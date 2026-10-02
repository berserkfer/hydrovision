"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listQueuedObservations,
  queueObservationLocally,
  removeQueuedObservation,
} from "@/photo-quality/offline-db";
import type { PhotoObservationInput } from "@/photo-quality/photo-observation.types";

/**
 * Guarda SIEMPRE en IndexedDB primero (nunca se pierde una observación), y sincroniza al
 * servidor en cuanto hay conexión — al guardar si ya hay señal, o al recuperar el evento
 * 'online' del navegador si no la había. Idempotente: el servidor deduplica por `id`.
 */
export function usePhotoObservationSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await listQueuedObservations();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB no disponible en este navegador/contexto — no rompe el resto del flujo.
    }
  }, []);

  const syncPending = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setSyncing(true);
    try {
      const pending = await listQueuedObservations();
      for (const observation of pending) {
        try {
          const response = await fetch("/api/photo-quality/observations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(observation),
          });
          if (response.ok) {
            await removeQueuedObservation(observation.id);
          }
        } catch {
          // Se perdió la señal a mitad de la sincronización — se detiene y se reintenta en
          // el próximo evento 'online'; lo ya sincronizado no se repite (se borró de la cola).
          break;
        }
      }
    } finally {
      setSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  const saveObservation = useCallback(
    async (input: PhotoObservationInput) => {
      await queueObservationLocally(input);
      await refreshPendingCount();
      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncPending();
      }
    },
    [refreshPendingCount, syncPending]
  );

  useEffect(() => {
    void refreshPendingCount();
    const handleOnline = () => {
      void syncPending();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refreshPendingCount, syncPending]);

  return { pendingCount, syncing, saveObservation, syncPending };
}
