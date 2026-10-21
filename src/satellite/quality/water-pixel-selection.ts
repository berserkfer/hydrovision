/**
 * Selección robusta del píxel de agua para un punto de monitoreo y una escena Sentinel-2 L2A.
 *
 * 1. Máscara SCL: se descartan nube (8, 9), sombra de nube (3), cirros (10), nieve (11) y
 *    píxeles sin dato / saturados / oscuros / sin clasificar (0, 1, 2, 7). Agua (6), suelo
 *    desnudo (5) y vegetación (4) se conservan solo para calcular NDWI.
 * 2. NDWI = (B03 − B08) / (B03 + B08) píxel a píxel.
 * 3. Un píxel es AGUA si SCL = 6 y NDWI > 0. Si el píxel del punto no es agua, se busca el
 *    píxel de agua más cercano dentro del radio (30 m por defecto = 3 píxeles de 10 m), solo si
 *    está "dentro del cauce" (ver más abajo).
 * 4. Sobre la ventana 3×3 del píxel elegido se mantiene la regla vigente: ≥ 3 píxeles de agua
 *    válidos y f_agua ≥ 0,5. Si no se cumple → bloqueado (no se predice).
 *    Si la ventana tiene nube, sombra, cirros o nieve → la escena se descarta para el punto.
 *
 * "Dentro del cauce": el proyecto todavía no tiene la geometría del Dren 4000. Mientras no se
 * configure un polígono del cauce (`isInChannel`), se exige que el píxel candidato forme parte
 * de un cuerpo de agua conexo (8-vecinos) de al menos MIN_WATER_PIXELS píxeles: así un charco
 * o un píxel aislado mal clasificado no puede "capturar" el punto. El criterio usado queda
 * registrado en `channelCheck`.
 *
 * Funciones puras: no leen red ni archivos.
 */

import { SCL_CLASS } from "./pixel-quality";
import { MIN_WATER_PIXELS, WATER_FRACTION_THRESHOLD, computeNdwi } from "./water-fraction";
import type { PairPixelSelection } from "../types/scientific-dataset.types";

export const DEFAULT_PIXEL_SIZE_M = 10;
export const DEFAULT_WATER_SEARCH_RADIUS_M = 30;
export const MAX_WATER_SEARCH_RADIUS_M = 60;
/** Ventana de evaluación alrededor del píxel elegido (3×3). */
export const EVALUATION_WINDOW_HALF = 1;

export type SclMaskClass = "water" | "land" | "contaminated" | "invalid";

/** Clasificación de un valor SCL para esta selección. */
export function classifyScl(scl: number | null | undefined): SclMaskClass {
  if (scl == null || !Number.isFinite(scl)) return "invalid";
  switch (Math.round(scl)) {
    case SCL_CLASS.WATER:
      return "water";
    case SCL_CLASS.VEGETATION:
    case SCL_CLASS.BARE_SOIL:
      return "land";
    case SCL_CLASS.CLOUD_SHADOW:
    case SCL_CLASS.CLOUD_MEDIUM:
    case SCL_CLASS.CLOUD_HIGH:
    case SCL_CLASS.THIN_CIRRUS:
    case SCL_CLASS.SNOW:
      return "contaminated";
    default:
      return "invalid"; // sin dato, saturado, oscuro, sin clasificar
  }
}

export interface GridPixel {
  /** Reflectancia de superficie (0–1) */
  green: number | null;
  nir: number | null;
  scl: number | null;
}

/**
 * Rejilla cuadrada (impar) de píxeles de 10 m centrada en el píxel que contiene el punto.
 * `pixels[row][col]`; el centro es (half, half).
 */
export interface PixelGrid {
  pixels: GridPixel[][];
  pixelSizeM: number;
}

export interface EvaluatedPixel {
  row: number;
  col: number;
  ndwi: number | null;
  mask: SclMaskClass;
  isWater: boolean;
}

export type WaterPixelSelectionStatus =
  | "center_water"
  | "adjusted"
  | "blocked_no_water_in_radius"
  | "blocked_insufficient_water"
  | "discarded_clouds"
  | "no_data";

export type ChannelCheck = "channel_polygon" | "connected_water_body";

/**
 * Regla de nubes en la ventana 3×3 del píxel usado:
 *  - strict:  un solo píxel con nube, sombra, cirros o nieve descarta la ventana (por defecto);
 *  - relaxed: para zona costera, se acepta si el píxel usado es agua, se cumple f_agua y hay
 *             como máximo 1 píxel contaminado (que no cuenta como válido).
 * Se elige con WATER_PIXEL_CLOUD_MODE y queda guardado en cada registro y par.
 */
export type CloudMode = "strict" | "relaxed";

export const CLOUD_MODE_LABELS: Record<CloudMode, string> = {
  strict: "Estricto (0 píxeles contaminados)",
  relaxed: "Relajado costero (≤ 1 píxel contaminado)",
};

export function getCloudMode(env: NodeJS.ProcessEnv = process.env): CloudMode {
  const raw = env.WATER_PIXEL_CLOUD_MODE?.trim().toLowerCase();
  return raw === "relaxed" || raw === "relajado" || raw === "coastal" || raw === "costero" ? "relaxed" : "strict";
}

function maxContaminated(mode: CloudMode): number {
  return mode === "relaxed" ? 1 : 0;
}

export interface WaterPixelSelection {
  status: WaterPixelSelectionStatus;
  /** true solo para center_water y adjusted */
  usable: boolean;
  /** Motivo legible (español) para el reporte de revisión. */
  reason: string;
  /** Desplazamiento del píxel elegido respecto al píxel del punto (filas hacia el sur, columnas hacia el este). */
  pixelOffset: { dRow: number; dCol: number } | null;
  adjustmentDistanceM: number;
  searchRadiusM: number;
  channelCheck: ChannelCheck;
  cloudMode: CloudMode;
  /** Métricas de la ventana 3×3 del píxel elegido (o del punto si no hubo elección). */
  window: {
    waterPixels: number;
    validPixels: number;
    contaminatedPixels: number;
    waterFraction: number | null;
  };
  selectedNdwi: number | null;
  selectedScl: number | null;
}

export interface SelectionOptions {
  searchRadiusM?: number;
  minWaterPixels?: number;
  waterFractionThreshold?: number;
  /**
   * Si existe un polígono del cauce, decide si un píxel (desplazamiento respecto al centro)
   * está dentro. Sin él se usa el criterio de cuerpo de agua conexo.
   */
  isInChannel?: (dRow: number, dCol: number) => boolean;
  /** Regla de nubes; por defecto la de WATER_PIXEL_CLOUD_MODE (strict). */
  cloudMode?: CloudMode;
}

export function getWaterSearchRadiusM(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.WATER_PIXEL_SEARCH_RADIUS_M);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_WATER_SEARCH_RADIUS_M;
  return Math.min(parsed, MAX_WATER_SEARCH_RADIUS_M);
}

function evaluateGrid(grid: PixelGrid): EvaluatedPixel[][] {
  return grid.pixels.map((row, r) =>
    row.map((p, c) => {
      const mask = classifyScl(p.scl);
      const ndwi = mask === "water" || mask === "land" ? computeNdwi(p.green, p.nir) : null;
      return { row: r, col: c, ndwi, mask, isWater: mask === "water" && ndwi !== null && ndwi > 0 };
    })
  );
}

function windowAround(evaluated: EvaluatedPixel[][], row: number, col: number, half: number): EvaluatedPixel[] {
  const out: EvaluatedPixel[] = [];
  for (let r = row - half; r <= row + half; r += 1) {
    for (let c = col - half; c <= col + half; c += 1) {
      const p = evaluated[r]?.[c];
      if (p) out.push(p);
    }
  }
  return out;
}

function windowStats(pixels: EvaluatedPixel[]) {
  const valid = pixels.filter((p) => (p.mask === "water" || p.mask === "land") && p.ndwi !== null);
  const water = valid.filter((p) => p.isWater).length;
  return {
    waterPixels: water,
    validPixels: valid.length,
    contaminatedPixels: pixels.filter((p) => p.mask === "contaminated").length,
    waterFraction: valid.length > 0 ? Number((water / valid.length).toFixed(4)) : null,
  };
}

/** Tamaño del cuerpo de agua conexo (8-vecinos) que contiene (row, col). */
function connectedWaterSize(evaluated: EvaluatedPixel[][], row: number, col: number): number {
  const seen = new Set<string>();
  const stack: Array<[number, number]> = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (seen.has(key) || !evaluated[r]?.[c]?.isWater) continue;
    seen.add(key);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr !== 0 || dc !== 0) stack.push([r + dr, c + dc]);
      }
    }
  }
  return seen.size;
}

export function selectWaterPixel(grid: PixelGrid, options: SelectionOptions = {}): WaterPixelSelection {
  const searchRadiusM = Math.min(options.searchRadiusM ?? getWaterSearchRadiusM(), MAX_WATER_SEARCH_RADIUS_M);
  const minWater = options.minWaterPixels ?? MIN_WATER_PIXELS;
  const threshold = options.waterFractionThreshold ?? WATER_FRACTION_THRESHOLD;
  const channelCheck: ChannelCheck = options.isInChannel ? "channel_polygon" : "connected_water_body";
  const cloudMode = options.cloudMode ?? getCloudMode();
  const tolerance = maxContaminated(cloudMode);
  const tooCloudy = (pixels: EvaluatedPixel[]) =>
    pixels.filter((p) => p.mask === "contaminated").length > tolerance;
  const cloudRule =
    cloudMode === "relaxed" ? "más de 1 píxel con nube, sombra, cirros o nieve (modo relajado)" : "nube, sombra de nube, cirros o nieve (modo estricto)";
  const size = grid.pixels.length;
  const half = Math.floor(size / 2);
  const evaluated = evaluateGrid(grid);

  const base = { searchRadiusM, channelCheck, cloudMode };

  const finish = (
    status: WaterPixelSelectionStatus,
    reason: string,
    row: number,
    col: number,
    chosen: boolean
  ): WaterPixelSelection => {
    const dRow = row - half;
    const dCol = col - half;
    const center = evaluated[row]?.[col];
    return {
      ...base,
      status,
      usable: status === "center_water" || status === "adjusted",
      reason,
      pixelOffset: chosen ? { dRow, dCol } : null,
      adjustmentDistanceM: chosen ? Number((Math.hypot(dRow, dCol) * grid.pixelSizeM).toFixed(1)) : 0,
      window: windowStats(windowAround(evaluated, row, col, EVALUATION_WINDOW_HALF)),
      selectedNdwi: chosen && center?.ndwi != null ? Number(center.ndwi.toFixed(4)) : null,
      selectedScl: chosen ? grid.pixels[row]?.[col]?.scl ?? null : null,
    };
  };

  if (size === 0 || size % 2 === 0 || grid.pixels.some((r) => r.length !== size)) {
    return finish("no_data", "Rejilla de píxeles inválida o vacía.", 0, 0, false);
  }

  const center = evaluated[half][half];
  if (center.mask === "invalid" && center.ndwi === null && windowStats(windowAround(evaluated, half, half, 1)).validPixels === 0) {
    return finish("no_data", "Sin datos SCL/B03/B08 válidos alrededor del punto.", half, half, false);
  }

  // Nubes, sombra, cirros o nieve junto al punto: la escena se descarta para este punto.
  const centerWindow = windowAround(evaluated, half, half, EVALUATION_WINDOW_HALF);
  if (tooCloudy(centerWindow)) {
    return finish(
      "discarded_clouds",
      `La ventana 3×3 del punto tiene ${cloudRule}: escena descartada para este punto.`,
      half,
      half,
      false
    );
  }

  let targetRow = half;
  let targetCol = half;
  let status: WaterPixelSelectionStatus = "center_water";

  if (!center.isWater) {
    const radiusPx = searchRadiusM / grid.pixelSizeM;
    const candidates: Array<{ p: EvaluatedPixel; dist: number }> = [];
    for (const row of evaluated) {
      for (const p of row) {
        if (!p.isWater) continue;
        const dRow = p.row - half;
        const dCol = p.col - half;
        const dist = Math.hypot(dRow, dCol);
        if (dist === 0 || dist > radiusPx + 1e-9) continue;
        const inChannel = options.isInChannel
          ? options.isInChannel(dRow, dCol)
          : connectedWaterSize(evaluated, p.row, p.col) >= minWater;
        if (inChannel) candidates.push({ p, dist });
      }
    }

    if (candidates.length === 0) {
      const why =
        center.mask === "water"
          ? `el píxel del punto es agua según SCL pero NDWI ≤ 0`
          : `el píxel del punto no es agua (SCL ${grid.pixels[half][half].scl ?? "?"})`;
      return finish(
        "blocked_no_water_in_radius",
        `Bloqueado: ${why} y no hay agua del cauce a ≤ ${searchRadiusM} m.`,
        half,
        half,
        false
      );
    }

    // Más cercano; empate → mayor NDWI; luego orden de fila/columna (determinista).
    candidates.sort(
      (a, b) =>
        a.dist - b.dist ||
        (b.p.ndwi ?? 0) - (a.p.ndwi ?? 0) ||
        a.p.row - b.p.row ||
        a.p.col - b.p.col
    );
    targetRow = candidates[0].p.row;
    targetCol = candidates[0].p.col;
    status = "adjusted";

    const adjustedWindow = windowAround(evaluated, targetRow, targetCol, EVALUATION_WINDOW_HALF);
    if (tooCloudy(adjustedWindow)) {
      return finish(
        "discarded_clouds",
        `La ventana 3×3 del píxel de agua más cercano tiene ${cloudRule}: escena descartada para este punto.`,
        targetRow,
        targetCol,
        true
      );
    }
  }

  const stats = windowStats(windowAround(evaluated, targetRow, targetCol, EVALUATION_WINDOW_HALF));
  if (stats.waterPixels < minWater || stats.waterFraction === null || stats.waterFraction < threshold) {
    return finish(
      "blocked_insufficient_water",
      `Bloqueado: la ventana 3×3 tiene ${stats.waterPixels} píxel(es) de agua y f_agua = ${
        stats.waterFraction ?? "—"
      } (se exige ≥ ${minWater} y ≥ ${threshold}).`,
      targetRow,
      targetCol,
      status === "adjusted"
    );
  }

  return finish(
    status,
    status === "center_water"
      ? "El píxel del punto es agua (SCL 6, NDWI > 0) y la ventana cumple la regla."
      : `Ajustado al píxel de agua más cercano dentro del cauce.`,
    targetRow,
    targetCol,
    true
  );
}

/** Rejilla necesaria para buscar en el radio y evaluar la ventana 3×3 del píxel elegido. */
export function requiredGridHalfSize(searchRadiusM: number, pixelSizeM = DEFAULT_PIXEL_SIZE_M): number {
  return Math.ceil(searchRadiusM / pixelSizeM) + EVALUATION_WINDOW_HALF;
}

/** Registro trazable de la selección, tal como se guarda en la observación y en el par. */
export interface WaterPixelSelectionRecord {
  status: WaterPixelSelectionStatus;
  usable: boolean;
  reason: string;
  originalCoordinate: { latitude: number; longitude: number };
  /** Centro del píxel usado; null si no se eligió píxel (bloqueado / descartado / sin datos). */
  adjustedCoordinate: { latitude: number; longitude: number } | null;
  adjustmentDistanceM: number;
  pixelOffset: { dRow: number; dCol: number } | null;
  searchRadiusM: number;
  channelCheck: ChannelCheck;
  cloudMode: CloudMode;
  window: WaterPixelSelection["window"];
  selectedNdwi: number | null;
  selectedScl: number | null;
}

export const WATER_PIXEL_STATUS_LABELS: Record<WaterPixelSelectionStatus, string> = {
  center_water: "Píxel del punto (agua)",
  adjusted: "Ajustado al agua más cercana",
  blocked_no_water_in_radius: "Bloqueado: sin agua en el radio",
  blocked_insufficient_water: "Bloqueado: f_agua insuficiente",
  discarded_clouds: "Descartado: nubes en la ventana",
  no_data: "Sin datos",
};

export function toPairPixelSelection(
  record: WaterPixelSelectionRecord | undefined
): PairPixelSelection | null {
  if (!record) return null;
  return {
    status: record.status,
    usable: record.usable,
    reason: record.reason,
    originalCoordinate: record.originalCoordinate,
    adjustedCoordinate: record.adjustedCoordinate,
    adjustmentDistanceM: record.adjustmentDistanceM,
    pixelOffset: record.pixelOffset,
    channelCheck: record.channelCheck,
    // Registros anteriores a la Fase 2 se evaluaron con la regla estricta.
    cloudMode: record.cloudMode ?? "strict",
  };
}

export function pixelExportColumns(selection: PairPixelSelection | null) {
  const used = selection?.adjustedCoordinate ?? null;
  return {
    pixel_status: selection?.status ?? null,
    pixel_adjustment_m: selection ? selection.adjustmentDistanceM : null,
    pixel_latitude: used?.latitude ?? null,
    pixel_longitude: used?.longitude ?? null,
    pixel_reason: selection?.reason ?? null,
    pixel_cloud_mode: selection?.cloudMode ?? null,
  };
}
