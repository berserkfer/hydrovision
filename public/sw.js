/**
 * Service worker del módulo de foto — estrategia "red primero, caché como respaldo".
 * Después de que el usuario cargó /foto con conexión al menos una vez, esa página y sus
 * recursos (JS/CSS) quedan en caché y siguen disponibles sin red la próxima vez — es lo que
 * hace que el Nivel 1 (offline) funcione de verdad, no solo en teoría.
 *
 * Deliberadamente NO intercepta /api/* — las respuestas de red (calibración, referencia
 * satelital) nunca se sirven desde una caché vieja; si no hay red, esas llamadas simplemente
 * fallan y el flujo se queda en Nivel 1, que no las necesita.
 */

const CACHE_NAME = "hydrovision-photo-quality-v1";
const PRECACHE_URLS = ["/foto", "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Si el precache falla (ej. instalado sin red), no bloquea la instalación — el
        // runtime caching de abajo igual va llenando la caché en la próxima visita online.
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // nunca servir datos de red desde caché vieja
  if (url.pathname.startsWith("/_next/webpack-hmr")) return; // no interferir con el dev server

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});
