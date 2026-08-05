/**
 * Cálculo de áreas — GIS Engine (Fase 5.2)
 * Aproximación esférica para polígonos pequeños (cuencas locales)
 */

import type { GeoPolygon, LatLng } from "../types";

const EARTH_RADIUS_M = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Área de polígono en km² (Shoelace + corrección latitud media) */
export function polygonAreaKm2(ring: LatLng[]): number {
  if (ring.length < 3) return 0;

  const avgLat =
    ring.reduce((sum, p) => sum + p.latitude, 0) / ring.length;
  const latFactor = Math.cos(toRadians(avgLat));

  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const xi = toRadians(ring[i].longitude) * latFactor * EARTH_RADIUS_M;
    const yi = toRadians(ring[i].latitude) * EARTH_RADIUS_M;
    const xj = toRadians(ring[j].longitude) * latFactor * EARTH_RADIUS_M;
    const yj = toRadians(ring[j].latitude) * EARTH_RADIUS_M;
    area += xi * yj - xj * yi;
  }

  return Number((Math.abs(area) / 2 / 1_000_000).toFixed(2));
}

/** Área de polígono en hectáreas */
export function polygonAreaHectares(ring: GeoPolygon): number {
  return Number((polygonAreaKm2(ring) * 100).toFixed(2));
}

/** Área de bounding box aproximada en km² */
export function bboxAreaKm2(bbox: { southWest: LatLng; northEast: LatLng }): number {
  const ring: LatLng[] = [
    bbox.southWest,
    { latitude: bbox.southWest.latitude, longitude: bbox.northEast.longitude },
    bbox.northEast,
    { latitude: bbox.northEast.latitude, longitude: bbox.southWest.longitude },
  ];
  return polygonAreaKm2(ring);
}
