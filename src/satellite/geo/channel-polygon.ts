/**
 * Polígono del cauce: validación de geometría y prueba "dentro del cauce".
 *
 * Además de las validaciones generales de GeoJSON (sistema de coordenadas, tamaño, zona):
 *  - solo Polygon / MultiPolygon (una línea no delimita un cauce);
 *  - cada anillo con área > 0 y sin autointersecciones;
 *  - cada agujero dentro de su anillo exterior;
 *  - como máximo MAX_CHANNEL_VERTICES vértices en total.
 */

import { GeoJsonValidationError, parseGeoJson, pointInPolygon, type GeoRing, type ParsedGeometry } from "./geojson";
import { toUtm, type LatLon } from "./projection";

export const MAX_CHANNEL_VERTICES = 20_000;

function ringAreaM2(ring: GeoRing): number {
  const pts = ring.map((p) => toUtm(p));
  let sum = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    sum += pts[i].easting * pts[i + 1].northing - pts[i + 1].easting * pts[i].northing;
  }
  return Math.abs(sum) / 2;
}

function segmentsIntersect(
  a: { easting: number; northing: number },
  b: { easting: number; northing: number },
  c: { easting: number; northing: number },
  d: { easting: number; northing: number }
): boolean {
  const orient = (p: typeof a, q: typeof a, r: typeof a) =>
    Math.sign((q.easting - p.easting) * (r.northing - p.northing) - (q.northing - p.northing) * (r.easting - p.easting));
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0; // cruce propio (los vértices compartidos no cuentan)
}

/** true si algún par de lados no consecutivos del anillo se cruza. */
export function ringSelfIntersects(ring: GeoRing): boolean {
  const pts = ring.map((p) => toUtm(p));
  const n = pts.length - 1; // último = primero
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 2; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue; // primer y último lado comparten vértice
      if (segmentsIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1])) return true;
    }
  }
  return false;
}

export interface ChannelPolygonGeometry {
  polygons: GeoRing[][];
  sourceCrs: ParsedGeometry["sourceCrs"];
  areaM2: number;
  vertices: number;
}

export function validateChannelPolygon(text: string, options: { maxBytes?: number } = {}): ChannelPolygonGeometry {
  const parsed = parseGeoJson(text, options);
  if (parsed.lines.length > 0 || parsed.polygons.length === 0) {
    throw new GeoJsonValidationError(
      "El cauce debe ser un Polygon o MultiPolygon. Para el eje del dren use la traza del buscador de tramos."
    );
  }
  const vertices = parsed.polygons.flat(2).length;
  if (vertices > MAX_CHANNEL_VERTICES) {
    throw new GeoJsonValidationError(`El polígono tiene ${vertices} vértices; el máximo es ${MAX_CHANNEL_VERTICES}.`);
  }

  let areaM2 = 0;
  parsed.polygons.forEach((polygon, pi) => {
    polygon.forEach((ring, ri) => {
      const label = `polígono ${pi + 1}, anillo ${ri + 1}`;
      if (ringSelfIntersects(ring)) throw new GeoJsonValidationError(`El ${label} se cruza a sí mismo (geometría inválida).`);
      if (ringAreaM2(ring) <= 1) throw new GeoJsonValidationError(`El ${label} no tiene área (puntos colineales o repetidos).`);
    });
    const [outer, ...holes] = polygon;
    holes.forEach((hole, hi) => {
      if (!pointInPolygon(hole[0], [outer])) {
        throw new GeoJsonValidationError(`El agujero ${hi + 1} del polígono ${pi + 1} queda fuera de su anillo exterior.`);
      }
    });
    areaM2 += ringAreaM2(outer) - holes.reduce((s, h) => s + ringAreaM2(h), 0);
  });

  return { polygons: parsed.polygons, sourceCrs: parsed.sourceCrs, areaM2: Math.round(areaM2), vertices };
}

export function isInsideChannel(point: LatLon, polygons: GeoRing[][]): boolean {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}
