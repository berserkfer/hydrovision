/**
 * Utilidades de coordenadas — GIS Engine (Fase 5.2)
 */

import type { BoundingBox, LatLng, MapViewport } from "../types";

const WGS84_MIN_LAT = -90;
const WGS84_MAX_LAT = 90;
const WGS84_MIN_LNG = -180;
const WGS84_MAX_LNG = 180;

/** Valida coordenada WGS84 */
export function isValidLatLng(point: LatLng): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= WGS84_MIN_LAT &&
    point.latitude <= WGS84_MAX_LAT &&
    point.longitude >= WGS84_MIN_LNG &&
    point.longitude <= WGS84_MAX_LNG
  );
}

/** Valida bounding box */
export function isValidBoundingBox(bbox: BoundingBox): boolean {
  return (
    isValidLatLng(bbox.southWest) &&
    isValidLatLng(bbox.northEast) &&
    bbox.southWest.latitude <= bbox.northEast.latitude &&
    bbox.southWest.longitude <= bbox.northEast.longitude
  );
}

/** Convierte tupla Leaflet [lat, lng] → LatLng */
export function fromLeafletTuple(coords: [number, number]): LatLng {
  return { latitude: coords[0], longitude: coords[1] };
}

/** Convierte LatLng → tupla Leaflet [lat, lng] */
export function toLeafletTuple(point: LatLng): [number, number] {
  return [point.latitude, point.longitude];
}

/** Calcula bounding box desde puntos */
export function computeBoundingBox(points: LatLng[]): BoundingBox {
  if (points.length === 0) {
    return {
      southWest: { latitude: -6.75, longitude: -79.95 },
      northEast: { latitude: -6.65, longitude: -79.85 },
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const p of points.slice(1)) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }

  const pad = 0.01;
  return {
    southWest: { latitude: minLat - pad, longitude: minLng - pad },
    northEast: { latitude: maxLat + pad, longitude: maxLng + pad },
  };
}

/** Zoom automático a partir de bounding box (heurística Web Mercator) */
export function computeAutoZoom(bbox: BoundingBox, viewportWidthPx = 800): number {
  const latDiff = Math.abs(bbox.northEast.latitude - bbox.southWest.latitude);
  const lngDiff = Math.abs(bbox.northEast.longitude - bbox.southWest.longitude);
  const maxDiff = Math.max(latDiff, lngDiff, 0.001);
  const zoom = Math.log2((viewportWidthPx * 360) / (256 * maxDiff)) - 1;
  return Math.max(8, Math.min(16, Math.round(zoom)));
}

/** Centro de bounding box */
export function bboxCenter(bbox: BoundingBox): LatLng {
  return {
    latitude: (bbox.southWest.latitude + bbox.northEast.latitude) / 2,
    longitude: (bbox.southWest.longitude + bbox.northEast.longitude) / 2,
  };
}

/** Viewport desde bounding box */
export function viewportFromBBox(bbox: BoundingBox): MapViewport {
  const center = bboxCenter(bbox);
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    zoom: computeAutoZoom(bbox),
    crs: "EPSG:4326",
  };
}

/** Punto dentro de bounding box */
export function isPointInBBox(point: LatLng, bbox: BoundingBox): boolean {
  return (
    point.latitude >= bbox.southWest.latitude &&
    point.latitude <= bbox.northEast.latitude &&
    point.longitude >= bbox.southWest.longitude &&
    point.longitude <= bbox.northEast.longitude
  );
}
