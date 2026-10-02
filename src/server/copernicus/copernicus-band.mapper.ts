/**
 * Mapeo de bandas Copernicus (Process API) → HydroVision.
 * A diferencia de GEE, Sentinel Hub/Copernicus ya expone nombres de banda con cero
 * (B03, B04, B05, B08, B11) que coinciden 1:1 con Sentinel2BandCode — mapeo identidad.
 */

import { isSentinel2BandCode, type Sentinel2ReflectanceMap } from "@/satellite/catalog/sentinel2-bands.catalog";
import { GEE_QC_BAND_SCL, processGeeSurfaceReflectances, type ProcessedGeeReflectance } from "@/server/gee/gee-band.mapper";

export function mapCopernicusReflectances(raw: Record<string, number>): Sentinel2ReflectanceMap {
  const result: Sentinel2ReflectanceMap = {};
  for (const [band, value] of Object.entries(raw)) {
    if (isSentinel2BandCode(band) && Number.isFinite(value)) {
      result[band] = value;
    }
  }
  return result;
}

/** Reutiliza la validación de escala/rango de gee-band.mapper con mapeo identidad Copernicus */
export function processCopernicusSurfaceReflectances(
  raw: Record<string, number>
): ProcessedGeeReflectance {
  return processGeeSurfaceReflectances(raw, mapCopernicusReflectances);
}

/** Separa bandas de reflectancia del canal QC SCL — misma constante que GEE (nombre idéntico) */
export function separateCopernicusReflectanceAndScl(raw: Record<string, number>): {
  reflectanceBands: Record<string, number>;
  sclRawValue: number | null;
} {
  const reflectanceBands: Record<string, number> = {};
  let sclRawValue: number | null = null;

  for (const [key, value] of Object.entries(raw)) {
    if (key === GEE_QC_BAND_SCL) {
      sclRawValue = Number.isFinite(value) ? value : null;
    } else {
      reflectanceBands[key] = value;
    }
  }

  return { reflectanceBands, sclRawValue };
}

/**
 * Extrae valores de banda desde la respuesta JSON de Process API.
 * El formato exacto de "application/json" de Sentinel Hub no está documentado byte-a-byte
 * sin una llamada real autenticada; se soportan defensivamente las formas más comunes
 * reportadas por la documentación pública (array plano, array de filas, u objeto por banda).
 * Si ninguna forma es reconocible, retorna {} — NUNCA se inventan valores de banda.
 */
export function extractBandValuesFromCopernicusProcess(
  response: unknown,
  bandOrder: readonly string[]
): Record<string, number> {
  const values: Record<string, number> = {};
  if (response === null || response === undefined) return values;

  // Forma objeto: { B03: 0.1, B04: 0.2, ... } o { data: { B03: ... } }
  if (typeof response === "object" && !Array.isArray(response)) {
    const asRecord = response as Record<string, unknown>;
    const candidateObject =
      "data" in asRecord && typeof asRecord.data === "object" && !Array.isArray(asRecord.data)
        ? (asRecord.data as Record<string, unknown>)
        : asRecord;

    const hasNamedBands = bandOrder.some((b) => typeof candidateObject[b] === "number");
    if (hasNamedBands) {
      for (const band of bandOrder) {
        const v = candidateObject[band];
        if (typeof v === "number" && Number.isFinite(v)) values[band] = v;
      }
      if (Object.keys(values).length > 0) return values;
    }

    // Forma { data: [[v1, v2, ...]] } (fila de píxel única, 1x1)
    if ("data" in asRecord && Array.isArray(asRecord.data)) {
      return extractFromArrayLike(asRecord.data, bandOrder);
    }
  }

  // Forma array plano [v1, v2, ...] o array de filas [[v1, v2, ...]]
  if (Array.isArray(response)) {
    return extractFromArrayLike(response, bandOrder);
  }

  return values;
}

function extractFromArrayLike(arr: unknown[], bandOrder: readonly string[]): Record<string, number> {
  const values: Record<string, number> = {};
  const row = Array.isArray(arr[0]) ? (arr[0] as unknown[]) : arr;

  if (row.length < bandOrder.length) return values;

  bandOrder.forEach((band, i) => {
    const v = row[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      values[band] = v;
    }
  });

  return values;
}

export interface CopernicusSceneDetailRow {
  sceneId: string;
  systemIndex: string;
  systemTimeStart: number | null;
  cloudPercentage: number | null;
}

/** Extrae filas de escena desde una respuesta STAC FeatureCollection (Catalog API) */
export function extractSceneDetailsFromCatalogSearch(response: unknown): CopernicusSceneDetailRow[] {
  if (!response || typeof response !== "object") return [];

  const root = response as { features?: unknown };
  if (!Array.isArray(root.features)) return [];

  const rows: CopernicusSceneDetailRow[] = [];

  for (const feature of root.features) {
    if (!feature || typeof feature !== "object") continue;
    const f = feature as { id?: unknown; properties?: Record<string, unknown> };
    const id = typeof f.id === "string" ? f.id : null;
    if (!id) continue;

    const datetime = f.properties?.datetime;
    const cloudCover = f.properties?.["eo:cloud_cover"];
    const timeMs = typeof datetime === "string" ? Date.parse(datetime) : NaN;

    rows.push({
      sceneId: id,
      systemIndex: id,
      systemTimeStart: Number.isFinite(timeMs) ? timeMs : null,
      cloudPercentage: typeof cloudCover === "number" && Number.isFinite(cloudCover) ? cloudCover : null,
    });
  }

  return rows;
}

export function systemTimeStartToAcquisitionDateCopernicus(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}
