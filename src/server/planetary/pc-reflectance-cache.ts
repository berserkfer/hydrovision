/**
 * Caché de reflectancias leídas por escena y punto (Planetary Computer).
 *
 * Una escena publicada no cambia, así que la lectura se reutiliza 6 h. Solo se guardan
 * lecturas obtenidas (nunca un fallo). Se vacía cuando cambia algo que afecta la selección
 * del píxel de agua (p. ej. el polígono del cauce).
 */

import { TtlCache } from "@/server/cache/ttl-cache";
import type { PlanetaryReflectanceRecord, PlanetaryReflectanceRequest } from "./planetary.adapter.types";

export const reflectanceCache = new TtlCache<PlanetaryReflectanceRecord>(6 * 60 * 60_000, 300);

export function reflectanceCacheKey(request: PlanetaryReflectanceRequest): string | null {
  if (!request.sceneId) return null;
  return `${request.sceneId}|${request.latitude.toFixed(6)}|${request.longitude.toFixed(6)}`;
}

export function clearPlanetaryReflectanceCache(): void {
  reflectanceCache.clear();
}
