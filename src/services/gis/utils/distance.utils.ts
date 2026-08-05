/**
 * Medición de distancias — GIS Engine (Fase 5.2)
 * Fórmula de Haversine (WGS84)
 */

import type { LatLng } from "../types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Distancia en km entre dos puntos */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Longitud total de una polilínea en km */
export function polylineLengthKm(path: LatLng[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(path[i - 1], path[i]);
  }
  return Number(total.toFixed(3));
}

/** Distancia en metros */
export function distanceMeters(a: LatLng, b: LatLng): number {
  return haversineDistance(a, b) * 1000;
}
