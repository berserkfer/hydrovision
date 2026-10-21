/**
 * Aptitud de tramos para Sentinel-2 (lógica pura).
 *
 * Por cada punto de muestreo de la traza y cada escena se aplica la misma selección del píxel
 * de agua que al resto de la plataforma (SCL = 6 y NDWI > 0, ventana 3×3, ≥ 3 píxeles de agua
 * conectados, f_agua ≥ 0,5, ajuste ≤ 30 m dentro del cauce). Luego se agrega por tramo:
 * frecuencia de aptitud, f_agua media, píxel representativo y distancia al punto histórico
 * más cercano (Nizama y Cabrera, 2014).
 */

import {
  requiredGridHalfSize,
  selectWaterPixel,
  type PixelGrid,
  type SelectionOptions,
  type WaterPixelSelectionStatus,
} from "../quality/water-pixel-selection";
import { UTM_17S_EPSG, distanceMeters, fromUtm, toUtm, type LatLon } from "../geo/projection";
import type { HistoricalPoint, TraceSample } from "../geo/trace";

/** Un tramo a ≤ este radio de un punto histórico se considera ese punto histórico. */
export const HISTORICAL_MATCH_RADIUS_M = 25;

/**
 * Rejilla de una escena que cubre toda la traza, en la CRS UTM del raster.
 * Valores en reflectancia (0–1); SCL entera. Fila 0 = norte.
 */
export interface SceneGrid {
  sceneId: string;
  acquisitionDate: string;
  cloudPercentage: number | null;
  epsg: number;
  pixelSizeM: number;
  /** Borde oeste (x) y borde norte (y) de la celda [0][0], en metros. */
  originX: number;
  originY: number;
  width: number;
  height: number;
  green: Array<number | null>;
  nir: Array<number | null>;
  scl: Array<number | null>;
}

export interface SampleSceneResult {
  sceneId: string;
  acquisitionDate: string;
  status: WaterPixelSelectionStatus;
  usable: boolean;
  waterFraction: number | null;
  /** Centro del píxel de agua usado (si es utilizable). */
  pixel: LatLon | null;
  adjustmentDistanceM: number;
}

function cellOf(grid: SceneGrid, point: LatLon): { row: number; col: number } {
  const p = toUtm(point, grid.epsg);
  return {
    col: Math.floor((p.easting - grid.originX) / grid.pixelSizeM),
    row: Math.floor((grid.originY - p.northing) / grid.pixelSizeM),
  };
}

function cellCenter(grid: SceneGrid, row: number, col: number): LatLon {
  return fromUtm(
    {
      easting: grid.originX + (col + 0.5) * grid.pixelSizeM,
      northing: grid.originY - (row + 0.5) * grid.pixelSizeM,
    },
    grid.epsg
  );
}

/** Sub-rejilla (2·half+1)² centrada en el píxel que contiene el punto; fuera de la escena = null. */
export function subGridAt(grid: SceneGrid, point: LatLon, half: number): { pixelGrid: PixelGrid; centerRow: number; centerCol: number } {
  const { row: r0, col: c0 } = cellOf(grid, point);
  const size = 2 * half + 1;
  const pixels = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const row = r0 - half + r;
      const col = c0 - half + c;
      if (row < 0 || col < 0 || row >= grid.height || col >= grid.width) {
        return { green: null, nir: null, scl: null };
      }
      const i = row * grid.width + col;
      return { green: grid.green[i] ?? null, nir: grid.nir[i] ?? null, scl: grid.scl[i] ?? null };
    })
  );
  return { pixelGrid: { pixels, pixelSizeM: grid.pixelSizeM }, centerRow: r0, centerCol: c0 };
}

export function evaluateSampleInScene(
  grid: SceneGrid,
  point: LatLon,
  options: SelectionOptions & { searchRadiusM: number }
): SampleSceneResult {
  const half = requiredGridHalfSize(options.searchRadiusM, grid.pixelSizeM);
  const { pixelGrid, centerRow, centerCol } = subGridAt(grid, point, half);
  const selection = selectWaterPixel(pixelGrid, options);
  const offset = selection.pixelOffset;
  return {
    sceneId: grid.sceneId,
    acquisitionDate: grid.acquisitionDate,
    status: selection.status,
    usable: selection.usable,
    waterFraction: selection.window.waterFraction,
    pixel: selection.usable && offset ? cellCenter(grid, centerRow + offset.dRow, centerCol + offset.dCol) : null,
    adjustmentDistanceM: selection.adjustmentDistanceM,
  };
}

export type CandidateOrigin = "nuevo" | "historico";
export type CandidateRole = "tramo" | "referencia";

export interface TramoCandidate {
  id: string;
  role: CandidateRole;
  origin: CandidateOrigin;
  /** Código del punto histórico si el candidato coincide con uno (≤ 25 m). */
  historicalCode: string | null;
  chainageM: number | null;
  /** Coordenada representativa: píxel de agua más frecuente; si no hubo, el punto muestreado. */
  coordinate: LatLon;
  utm17s: { easting: number; northing: number };
  samplePoint: LatLon;
  scenesEvaluated: number;
  scenesApt: number;
  scenesDiscardedClouds: number;
  /** aptas / evaluadas (escenas con datos en el punto). null si ninguna tuvo datos. */
  aptitudeFrequency: number | null;
  meanWaterFraction: number | null;
  nearestHistorical: { codigo: string; distanceM: number };
  statusCounts: Partial<Record<WaterPixelSelectionStatus, number>>;
}

function round(v: number, d: number) {
  return Number(v.toFixed(d));
}

export function nearestHistorical(point: LatLon, historical: HistoricalPoint[]): { codigo: string; distanceM: number } {
  let best = { codigo: "—", distanceM: Number.POSITIVE_INFINITY };
  for (const h of historical) {
    const d = distanceMeters(point, h.coordinate);
    if (d < best.distanceM) best = { codigo: h.codigo, distanceM: d };
  }
  return { codigo: best.codigo, distanceM: round(best.distanceM, 1) };
}

export function aggregateCandidate(
  sample: TraceSample,
  role: CandidateRole,
  results: SampleSceneResult[],
  historical: HistoricalPoint[]
): TramoCandidate {
  const evaluated = results.filter((r) => r.status !== "no_data");
  const apt = evaluated.filter((r) => r.usable);
  const fractions = evaluated.map((r) => r.waterFraction).filter((v): v is number => v !== null);

  // Píxel representativo: el centro de píxel utilizable que más se repite entre escenas.
  const counts = new Map<string, { point: LatLon; n: number }>();
  for (const r of apt) {
    if (!r.pixel) continue;
    const key = `${r.pixel.latitude.toFixed(6)},${r.pixel.longitude.toFixed(6)}`;
    const entry = counts.get(key) ?? { point: r.pixel, n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  }
  const representative = [...counts.values()].sort((a, b) => b.n - a.n)[0]?.point ?? sample.coordinate;
  const near = nearestHistorical(representative, historical);
  const isHistorical = role === "referencia" || near.distanceM <= HISTORICAL_MATCH_RADIUS_M;
  const utm = toUtm(representative, UTM_17S_EPSG);

  const statusCounts: Partial<Record<WaterPixelSelectionStatus, number>> = {};
  for (const r of results) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

  return {
    id: sample.id,
    role,
    origin: isHistorical ? "historico" : "nuevo",
    historicalCode: isHistorical ? near.codigo : null,
    chainageM: sample.chainageM,
    coordinate: { latitude: round(representative.latitude, 7), longitude: round(representative.longitude, 7) },
    utm17s: { easting: round(utm.easting, 1), northing: round(utm.northing, 1) },
    samplePoint: sample.coordinate,
    scenesEvaluated: evaluated.length,
    scenesApt: apt.length,
    scenesDiscardedClouds: results.filter((r) => r.status === "discarded_clouds").length,
    aptitudeFrequency: evaluated.length > 0 ? round(apt.length / evaluated.length, 4) : null,
    meanWaterFraction: fractions.length > 0 ? round(fractions.reduce((a, b) => a + b, 0) / fractions.length, 4) : null,
    nearestHistorical: near,
    statusCounts,
  };
}

/** Orden: más frecuencia de aptitud, luego más f_agua media, luego a lo largo de la traza. */
export function rankCandidates(candidates: TramoCandidate[]): TramoCandidate[] {
  return [...candidates].sort(
    (a, b) =>
      (b.aptitudeFrequency ?? -1) - (a.aptitudeFrequency ?? -1) ||
      (b.meanWaterFraction ?? -1) - (a.meanWaterFraction ?? -1) ||
      (a.chainageM ?? Number.MAX_SAFE_INTEGER) - (b.chainageM ?? Number.MAX_SAFE_INTEGER) ||
      a.id.localeCompare(b.id)
  );
}
