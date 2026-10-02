"use client";

import { useEffect } from "react";

/**
 * Registra el service worker del módulo de foto — condición literal para que el Nivel 1
 * funcione sin conexión (Tarea 3): sin este registro, nada queda cacheado y "offline" no
 * sería real. Montado una sola vez en el layout raíz.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Entorno sin soporte (ej. iframe restringido) — el resto de la app sigue funcionando
      // normalmente, solo sin capacidad offline real.
    });
  }, []);

  return null;
}
