/**
 * Traza del Dren 4000 y muestreo cada N metros a lo largo de ella.
 *
 * Sin geometría subida, la traza por defecto es una poligonal que une P1 → P5 en orden
 * (puntos históricos de Nizama y Cabrera, 2014). Es APROXIMADA: une puntos con rectas y no
 * sigue las curvas reales del dren. Con un GeoJSON de línea se usa esa línea; con un polígono,
 * se muestrea una rejilla de puntos cada N metros dentro del polígono.
 */

import { DREN_4000_POINTS } from "@/data/mock/dren-4000-real-data";
import { pointInPolygon, type GeoLine, type GeoRing, type ParsedGeometry } from "./geojson";
import { fromUtm, toUtm, type LatLon } from "./projection";

export const DEFAULT_SAMPLE_SPACING_M = 50;
/** Puntos dentro del dren (P1–P5) que definen la traza por defecto. */
export const DRAIN_POINT_CODES = ["P1", "P2", "P3", "P4", "P5"] as const;
/** Puntos históricos con agua visible, conservados como referencia. */
export const REFERENCE_POINT_CODES = ["P6", "P7", "P8", "P9", "P10"] as const;

export interface HistoricalPoint {
  codigo: string;
  nombre: string;
  coordinate: LatLon;
}

export function historicalPoints(): HistoricalPoint[] {
  return DREN_4000_POINTS.map((p) => ({
    codigo: p.codigo,
    nombre: p.nombre,
    coordinate: { latitude: p.coordenadas.latitude, longitude: p.coordenadas.longitude },
  }));
}

export type TraceSource = "default_points" | "uploaded_line" | "uploaded_polygon";

export interface Trace {
  source: TraceSource;
  description: string;
  lines: GeoLine[];
  polygons: GeoRing[][];
}

export function defaultTrace(): Trace {
  const byCode = new Map(historicalPoints().map((p) => [p.codigo, p.coordinate]));
  const line = DRAIN_POINT_CODES.map((c) => byCode.get(c)).filter((p): p is LatLon => Boolean(p));
  return {
    source: "default_points",
    description: "Traza aproximada P1 → P5 (rectas entre puntos históricos; no sigue las curvas del dren).",
    lines: [line],
    polygons: [],
  };
}

export function traceFromGeometry(geometry: ParsedGeometry, name: string): Trace {
  const isPolygon = geometry.polygons.length > 0 && geometry.lines.length === 0;
  return {
    source: isPolygon ? "uploaded_polygon" : "uploaded_line",
    description: isPolygon
      ? `Polígono subido (${name}): rejilla de puntos dentro del polígono.`
      : `Línea subida (${name}).`,
    lines: geometry.lines,
    polygons: isPolygon ? geometry.polygons : [],
  };
}

export interface TraceSample {
  /** Identificador estable: línea + distancia a lo largo (o fila/columna de la rejilla). */
  id: string;
  coordinate: LatLon;
  /** Distancia desde el inicio de su línea (m); null en rejillas de polígono. */
  chainageM: number | null;
}

/** Puntos cada `spacing` metros a lo largo de cada línea (incluye el inicio y el final). */
export function sampleLine(line: GeoLine, spacing: number, lineIndex = 0): TraceSample[] {
  const utm = line.map((p) => toUtm(p));
  const samples: TraceSample[] = [];
  let travelled = 0;
  let nextAt = 0;
  for (let i = 0; i < utm.length - 1; i += 1) {
    const a = utm[i];
    const b = utm[i + 1];
    const segment = Math.hypot(b.easting - a.easting, b.northing - a.northing);
    while (nextAt <= travelled + segment + 1e-6) {
      const t = segment === 0 ? 0 : (nextAt - travelled) / segment;
      samples.push({
        id: `L${lineIndex}-${Math.round(nextAt)}`,
        coordinate: fromUtm({ easting: a.easting + t * (b.easting - a.easting), northing: a.northing + t * (b.northing - a.northing) }),
        chainageM: Math.round(nextAt),
      });
      nextAt += spacing;
    }
    travelled += segment;
  }
  // Asegura el extremo final si quedó a más de medio paso del último punto muestreado.
  const total = Math.round(travelled);
  if (samples.length === 0 || total - (samples[samples.length - 1].chainageM ?? 0) > spacing / 2) {
    samples.push({ id: `L${lineIndex}-${total}`, coordinate: line[line.length - 1], chainageM: total });
  }
  return samples;
}

/** Rejilla de puntos cada `spacing` metros dentro de un polígono. */
export function samplePolygon(polygon: GeoRing[], spacing: number, polygonIndex = 0): TraceSample[] {
  const utm = polygon[0].map((p) => toUtm(p));
  const minE = Math.min(...utm.map((p) => p.easting));
  const maxE = Math.max(...utm.map((p) => p.easting));
  const minN = Math.min(...utm.map((p) => p.northing));
  const maxN = Math.max(...utm.map((p) => p.northing));
  const samples: TraceSample[] = [];
  let row = 0;
  for (let n = maxN - spacing / 2; n >= minN; n -= spacing, row += 1) {
    let col = 0;
    for (let e = minE + spacing / 2; e <= maxE; e += spacing, col += 1) {
      const coordinate = fromUtm({ easting: e, northing: n });
      if (pointInPolygon(coordinate, polygon)) {
        samples.push({ id: `G${polygonIndex}-${row}-${col}`, coordinate, chainageM: null });
      }
    }
  }
  return samples;
}

export function sampleTrace(trace: Trace, spacing = DEFAULT_SAMPLE_SPACING_M): TraceSample[] {
  return [
    ...trace.lines.flatMap((line, i) => sampleLine(line, spacing, i)),
    ...trace.polygons.flatMap((poly, i) => samplePolygon(poly, spacing, i)),
  ];
}

export function traceLengthM(trace: Trace): number {
  return trace.lines.reduce((sum, line) => {
    const utm = line.map((p) => toUtm(p));
    let len = 0;
    for (let i = 0; i < utm.length - 1; i += 1) {
      len += Math.hypot(utm[i + 1].easting - utm[i].easting, utm[i + 1].northing - utm[i].northing);
    }
    return sum + len;
  }, 0);
}

/** Caja WGS84 que contiene la traza y los puntos de referencia, con margen en metros. */
export function boundingBox(points: LatLon[], marginM: number): { min: LatLon; max: LatLon } {
  const utm = points.map((p) => toUtm(p));
  const min = fromUtm({
    easting: Math.min(...utm.map((p) => p.easting)) - marginM,
    northing: Math.min(...utm.map((p) => p.northing)) - marginM,
  });
  const max = fromUtm({
    easting: Math.max(...utm.map((p) => p.easting)) + marginM,
    northing: Math.max(...utm.map((p) => p.northing)) + marginM,
  });
  return { min, max };
}
