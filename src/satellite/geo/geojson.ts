/**
 * Lectura y validación de GeoJSON subido por el usuario (traza del dren, polígono del cauce).
 *
 * - Acepta Geometry, Feature o FeatureCollection con LineString, MultiLineString, Polygon o
 *   MultiPolygon.
 * - Sistema de coordenadas: WGS84 geográficas (lo normal en GeoJSON, RFC 7946) o, si el archivo
 *   declara `crs` EPSG:32717 (UTM 17S), se convierte a WGS84. Cualquier otro `crs` se rechaza.
 * - Tamaño máximo configurable (GEOJSON_MAX_BYTES, por defecto 1 MB).
 * - La geometría debe estar en la zona del Dren 4000 (no se acepta un archivo de otro lugar).
 */

import { UTM_17S_EPSG, fromUtm, type LatLon } from "./projection";

export const DEFAULT_GEOJSON_MAX_BYTES = 1_000_000;
/** Caja amplia alrededor de Santa Rosa / Dren 4000 (≈ 20 km) para detectar archivos de otra zona. */
export const DREN_REGION_BBOX = { minLat: -6.98, maxLat: -6.77, minLon: -80.03, maxLon: -79.82 };

export type GeoLine = LatLon[];
export type GeoRing = LatLon[];

export interface ParsedGeometry {
  lines: GeoLine[];
  /** Cada polígono = anillo exterior + agujeros. */
  polygons: GeoRing[][];
  sourceCrs: "EPSG:4326" | "EPSG:32717";
}

export class GeoJsonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeoJsonValidationError";
  }
}

export function getGeoJsonMaxBytes(env: NodeJS.ProcessEnv = process.env): number {
  const v = Number.parseInt(env.GEOJSON_MAX_BYTES ?? "", 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, 20_000_000) : DEFAULT_GEOJSON_MAX_BYTES;
}

function detectCrs(root: Record<string, unknown>): "EPSG:4326" | "EPSG:32717" {
  const crs = root.crs as { properties?: { name?: unknown } } | undefined;
  const name = typeof crs?.properties?.name === "string" ? crs.properties.name.toUpperCase() : null;
  if (!name) return "EPSG:4326";
  if (/(EPSG::?4326|CRS84)$/.test(name)) return "EPSG:4326";
  if (/EPSG::?32717$/.test(name)) return "EPSG:32717";
  throw new GeoJsonValidationError(
    `Sistema de coordenadas no admitido (${name}). Use WGS84 (EPSG:4326) o UTM 17S (EPSG:32717).`
  );
}

function toLatLon(position: unknown, crs: ParsedGeometry["sourceCrs"]): LatLon {
  if (!Array.isArray(position) || position.length < 2) {
    throw new GeoJsonValidationError("Posición inválida: se esperaba [x, y].");
  }
  const [x, y] = position as unknown[];
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
    throw new GeoJsonValidationError("Coordenada no numérica.");
  }
  if (crs === "EPSG:32717") return fromUtm({ easting: x, northing: y }, UTM_17S_EPSG);
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    throw new GeoJsonValidationError(
      "Coordenadas fuera de rango geográfico. Si están en UTM, declare \"crs\": EPSG:32717."
    );
  }
  return { longitude: x, latitude: y };
}

function readLine(coords: unknown, crs: ParsedGeometry["sourceCrs"]): GeoLine {
  if (!Array.isArray(coords) || coords.length < 2) {
    throw new GeoJsonValidationError("Una línea necesita al menos 2 posiciones.");
  }
  return coords.map((p) => toLatLon(p, crs));
}

function readRing(coords: unknown, crs: ParsedGeometry["sourceCrs"]): GeoRing {
  if (!Array.isArray(coords) || coords.length < 4) {
    throw new GeoJsonValidationError("Un anillo de polígono necesita al menos 4 posiciones.");
  }
  const ring = coords.map((p) => toLatLon(p, crs));
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first.latitude - last.latitude) > 1e-9 || Math.abs(first.longitude - last.longitude) > 1e-9) {
    throw new GeoJsonValidationError("El anillo del polígono no está cerrado (primera ≠ última posición).");
  }
  return ring;
}

function collectGeometries(node: unknown): Array<{ type: string; coordinates: unknown }> {
  if (!node || typeof node !== "object") throw new GeoJsonValidationError("GeoJSON vacío o inválido.");
  const obj = node as Record<string, unknown>;
  switch (obj.type) {
    case "FeatureCollection":
      if (!Array.isArray(obj.features)) throw new GeoJsonValidationError("FeatureCollection sin 'features'.");
      return obj.features.flatMap((f) => collectGeometries(f));
    case "Feature":
      return collectGeometries(obj.geometry);
    case "GeometryCollection":
      if (!Array.isArray(obj.geometries)) throw new GeoJsonValidationError("GeometryCollection sin 'geometries'.");
      return obj.geometries.flatMap((g) => collectGeometries(g));
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      return [{ type: obj.type, coordinates: obj.coordinates }];
    default:
      throw new GeoJsonValidationError(
        `Tipo de geometría no admitido: ${String(obj.type)}. Use LineString o Polygon (o sus versiones Multi).`
      );
  }
}

function insideRegion(p: LatLon): boolean {
  const b = DREN_REGION_BBOX;
  return p.latitude >= b.minLat && p.latitude <= b.maxLat && p.longitude >= b.minLon && p.longitude <= b.maxLon;
}

/** Valida y normaliza a WGS84. Lanza GeoJsonValidationError con un mensaje en español. */
export function parseGeoJson(text: string, options: { maxBytes?: number } = {}): ParsedGeometry {
  const maxBytes = options.maxBytes ?? getGeoJsonMaxBytes();
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > maxBytes) {
    throw new GeoJsonValidationError(
      `El archivo pesa ${(bytes / 1_000_000).toFixed(2)} MB; el máximo es ${(maxBytes / 1_000_000).toFixed(2)} MB.`
    );
  }

  let root: Record<string, unknown>;
  try {
    root = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new GeoJsonValidationError("El archivo no es JSON válido.");
  }
  const crs = detectCrs(root);

  const result: ParsedGeometry = { lines: [], polygons: [], sourceCrs: crs };
  for (const geom of collectGeometries(root)) {
    const c = geom.coordinates;
    if (geom.type === "LineString") result.lines.push(readLine(c, crs));
    if (geom.type === "MultiLineString") {
      if (!Array.isArray(c)) throw new GeoJsonValidationError("MultiLineString inválido.");
      c.forEach((line) => result.lines.push(readLine(line, crs)));
    }
    if (geom.type === "Polygon") {
      if (!Array.isArray(c) || c.length === 0) throw new GeoJsonValidationError("Polygon sin anillos.");
      result.polygons.push(c.map((ring) => readRing(ring, crs)));
    }
    if (geom.type === "MultiPolygon") {
      if (!Array.isArray(c)) throw new GeoJsonValidationError("MultiPolygon inválido.");
      c.forEach((poly) => {
        if (!Array.isArray(poly) || poly.length === 0) throw new GeoJsonValidationError("Polígono sin anillos.");
        result.polygons.push(poly.map((ring) => readRing(ring, crs)));
      });
    }
  }

  if (result.lines.length === 0 && result.polygons.length === 0) {
    throw new GeoJsonValidationError("El archivo no contiene líneas ni polígonos.");
  }

  const all = [...result.lines.flat(), ...result.polygons.flat(2)];
  if (!all.every(insideRegion)) {
    throw new GeoJsonValidationError(
      "La geometría queda fuera de la zona del Dren 4000 (Santa Rosa, Lambayeque). Revise el archivo o el sistema de coordenadas."
    );
  }
  return result;
}

/** Punto dentro de polígono (con agujeros), por paridad de cruces, en coordenadas geográficas. */
export function pointInPolygon(point: LatLon, polygon: GeoRing[]): boolean {
  const inRing = (ring: GeoRing) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      const crosses =
        a.latitude > point.latitude !== b.latitude > point.latitude &&
        point.longitude <
          ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude;
      if (crosses) inside = !inside;
    }
    return inside;
  };
  const [outer, ...holes] = polygon;
  return inRing(outer) && !holes.some(inRing);
}
