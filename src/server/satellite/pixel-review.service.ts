/**
 * Revisión de píxeles antes de calibrar: para cada punto del Dren 4000 y cada escena reciente,
 * qué píxel se usó, si se ajustó (cuánto y por qué) o si quedó bloqueado/descartado.
 *
 * Consulta los puntos uno por uno (no en paralelo) para respetar el límite de Planetary
 * Computer; las lecturas quedan en caché y la siguiente revisión es inmediata.
 */

import { DREN_4000_POINTS, DREN_4000_RIO_ID } from "@/data/mock/dren-4000-real-data";
import {
  WATER_PIXEL_STATUS_LABELS,
  type WaterPixelSelectionStatus,
} from "@/satellite/quality/water-pixel-selection";
import type { SatelliteObservation } from "@/satellite/types/satellite-observation.types";
import { satelliteService } from "./satellite.service";
import type { SatelliteQueryFilters } from "./satellite.types";

export type PixelReviewStatus = WaterPixelSelectionStatus | "not_evaluated";

export interface PixelReviewRow {
  stationId: string;
  codigo: string;
  nombre: string;
  sceneId: string | null;
  acquisitionDate: string;
  provider: string;
  status: PixelReviewStatus;
  statusLabel: string;
  usable: boolean | null;
  reason: string;
  originalLatitude: number | null;
  originalLongitude: number | null;
  adjustedLatitude: number | null;
  adjustedLongitude: number | null;
  adjustmentDistanceM: number | null;
  waterFraction: number | null;
  waterPixels: number | null;
  validPixels: number | null;
  cloudPercentage: number | null;
}

export interface PixelReviewStationGap {
  stationId: string;
  codigo: string;
  nombre: string;
  reason: string;
}

export interface PixelReviewReport {
  generatedAt: string;
  searchRadiusM: number | null;
  rows: PixelReviewRow[];
  /** Puntos sin ninguna escena para revisar. */
  stationsWithoutScenes: PixelReviewStationGap[];
  summary: Record<PixelReviewStatus, number>;
  note: string;
}

export interface PixelReviewDeps {
  listObservations: (filters: SatelliteQueryFilters) => Promise<SatelliteObservation[]>;
  now: () => Date;
}

const defaultDeps: PixelReviewDeps = {
  listObservations: async (filters) => (await satelliteService.listObservations(filters)).observations,
  now: () => new Date(),
};

export const PIXEL_REVIEW_STATUSES: PixelReviewStatus[] = [
  "center_water",
  "adjusted",
  "blocked_no_water_in_radius",
  "blocked_insufficient_water",
  "discarded_clouds",
  "no_data",
  "not_evaluated",
];

export const PIXEL_REVIEW_STATUS_LABELS: Record<PixelReviewStatus, string> = {
  ...WATER_PIXEL_STATUS_LABELS,
  not_evaluated: "Sin selección de píxel (proveedor sin soporte)",
};

export function toPixelReviewRow(
  station: { id: string; codigo: string; nombre: string },
  observation: SatelliteObservation
): PixelReviewRow {
  const selection = observation.waterPixelSelection;
  const status: PixelReviewStatus = selection?.status ?? "not_evaluated";
  return {
    stationId: station.id,
    codigo: station.codigo,
    nombre: station.nombre,
    sceneId: observation.sceneId,
    acquisitionDate: observation.acquisitionDate,
    provider: observation.provider ?? "unknown",
    status,
    statusLabel: PIXEL_REVIEW_STATUS_LABELS[status],
    usable: selection ? selection.usable : null,
    reason: selection?.reason ?? "El proveedor de esta escena no aplica la selección de píxel de agua.",
    originalLatitude: selection?.originalCoordinate.latitude ?? null,
    originalLongitude: selection?.originalCoordinate.longitude ?? null,
    adjustedLatitude: selection?.adjustedCoordinate?.latitude ?? null,
    adjustedLongitude: selection?.adjustedCoordinate?.longitude ?? null,
    adjustmentDistanceM: selection ? selection.adjustmentDistanceM : null,
    waterFraction: selection?.window.waterFraction ?? null,
    waterPixels: selection?.window.waterPixels ?? null,
    validPixels: selection?.window.validPixels ?? null,
    cloudPercentage: observation.cloudPercentage,
  };
}

export async function buildPixelReview(
  options: { days?: number } = {},
  deps: PixelReviewDeps = defaultDeps
): Promise<PixelReviewReport> {
  const days = Math.min(Math.max(options.days ?? 90, 15), 365);
  const now = deps.now();
  const fechaInicio = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const fechaFin = now.toISOString().slice(0, 10);

  const rows: PixelReviewRow[] = [];
  const stationsWithoutScenes: PixelReviewStationGap[] = [];
  let searchRadiusM: number | null = null;

  for (const point of DREN_4000_POINTS) {
    const station = {
      id: `${DREN_4000_RIO_ID}-${point.codigo.toLowerCase()}`,
      codigo: point.codigo,
      nombre: point.nombre,
    };
    let observations: SatelliteObservation[] = [];
    try {
      observations = await deps.listObservations({
        stationId: station.id,
        fechaInicio,
        fechaFin,
        usePlanetaryComputer: true,
      });
    } catch {
      observations = [];
    }

    const live = observations.filter((o) => !o.isSimulated);
    if (live.length === 0) {
      stationsWithoutScenes.push({
        stationId: station.id,
        codigo: station.codigo,
        nombre: station.nombre,
        reason: `Sin escenas Sentinel-2 reales con nubosidad ≤ 30 % en los últimos ${days} días (o el proveedor no respondió).`,
      });
      continue;
    }
    for (const observation of live) {
      searchRadiusM ??= observation.waterPixelSelection?.searchRadiusM ?? null;
      rows.push(toPixelReviewRow(station, observation));
    }
  }

  rows.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }) || b.acquisitionDate.localeCompare(a.acquisitionDate));

  const summary = Object.fromEntries(PIXEL_REVIEW_STATUSES.map((s) => [s, 0])) as Record<PixelReviewStatus, number>;
  for (const row of rows) summary[row.status] += 1;

  return {
    generatedAt: now.toISOString(),
    searchRadiusM,
    rows,
    stationsWithoutScenes,
    summary,
    note:
      "Revise los puntos ajustados y bloqueados antes de calibrar. Un ajuste mueve el muestreo al píxel de agua más cercano dentro del cauce (cuerpo de agua conexo, mientras no haya polígono del cauce); un bloqueo o descarte excluye la escena del punto.",
  };
}

const CSV_COLUMNS: Array<[keyof PixelReviewRow, string]> = [
  ["codigo", "punto"],
  ["nombre", "nombre"],
  ["acquisitionDate", "fecha_escena"],
  ["sceneId", "escena"],
  ["provider", "proveedor"],
  ["status", "estado"],
  ["statusLabel", "estado_descripcion"],
  ["originalLatitude", "lat_original"],
  ["originalLongitude", "lon_original"],
  ["adjustedLatitude", "lat_ajustada"],
  ["adjustedLongitude", "lon_ajustada"],
  ["adjustmentDistanceM", "distancia_ajuste_m"],
  ["waterFraction", "f_agua"],
  ["waterPixels", "pixeles_agua"],
  ["validPixels", "pixeles_validos"],
  ["cloudPercentage", "nubosidad_escena_pct"],
  ["reason", "motivo"],
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function pixelReviewToCsv(report: PixelReviewReport): string {
  const header = CSV_COLUMNS.map(([, name]) => name).join(",");
  const lines = report.rows.map((row) => CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(","));
  return [header, ...lines].join("\n") + "\n";
}
