/**
 * Validación de geometrías — GIS Engine (Fase 5.2)
 */

import type { GeoPolygon, GeoPolyline, LatLng } from "../types";
import { isValidLatLng } from "./coordinate.utils";

export interface GeometryValidationResult {
  valid: boolean;
  errors: string[];
}

/** Valida polilínea */
export function validatePolyline(path: GeoPolyline): GeometryValidationResult {
  const errors: string[] = [];

  if (path.length < 2) {
    errors.push("La polilínea requiere al menos 2 vértices.");
  }

  path.forEach((point, i) => {
    if (!isValidLatLng(point)) {
      errors.push(`Vértice ${i + 1} tiene coordenadas inválidas.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/** Valida polígono (anillo cerrado o abierto) */
export function validatePolygon(ring: GeoPolygon): GeometryValidationResult {
  const errors: string[] = [];

  if (ring.length < 3) {
    errors.push("El polígono requiere al menos 3 vértices.");
  }

  ring.forEach((point, i) => {
    if (!isValidLatLng(point)) {
      errors.push(`Vértice ${i + 1} tiene coordenadas inválidas.`);
    }
  });

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    first &&
    last &&
    (first.latitude !== last.latitude || first.longitude !== last.longitude)
  ) {
    errors.push("Advertencia: el anillo no está explícitamente cerrado (se acepta para mock).");
  }

  return { valid: errors.length === 0 || errors.every((e) => e.startsWith("Advertencia")), errors };
}

/** Valida conjunto de puntos de monitoreo */
export function validatePoints(points: LatLng[]): GeometryValidationResult {
  const errors: string[] = [];
  points.forEach((p, i) => {
    if (!isValidLatLng(p)) errors.push(`Punto ${i + 1} inválido.`);
  });
  return { valid: errors.length === 0, errors };
}

/** Cierra anillo de polígono si está abierto */
export function closePolygonRing(ring: GeoPolygon): GeoPolygon {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.latitude === last.latitude && first.longitude === last.longitude) {
    return ring;
  }
  return [...ring, first];
}
