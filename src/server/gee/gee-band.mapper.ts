/**
 * Mapeo bandas GEE (B2…) → HydroVision (B02…)
 */

import type { Sentinel2BandCode, Sentinel2ReflectanceMap } from "@/satellite/catalog/sentinel2-bands.catalog";

const GEE_TO_HV_BAND: Record<string, Sentinel2BandCode> = {
  B2: "B02",
  B3: "B03",
  B4: "B04",
  B5: "B05",
  B6: "B06",
  B7: "B07",
  B8: "B08",
  B8A: "B8A",
  B11: "B11",
  B12: "B12",
};

export function mapGeeBandToHydroVision(code: string): Sentinel2BandCode | null {
  return GEE_TO_HV_BAND[code] ?? null;
}

export function mapGeeReflectances(raw: Record<string, number>): Sentinel2ReflectanceMap {
  const result: Sentinel2ReflectanceMap = {};
  for (const [geeBand, value] of Object.entries(raw)) {
    const hvBand = mapGeeBandToHydroVision(geeBand);
    if (hvBand && Number.isFinite(value)) {
      result[hvBand] = value;
    }
  }
  return result;
}

export function extractBandValuesFromComputePixels(response: unknown): Record<string, number> {
  const values: Record<string, number> = {};

  if (!response || typeof response !== "object") return values;

  const root = response as {
    bands?: Array<{ id?: string; name?: string; data?: { type?: string; values?: number[] } }>;
  };

  for (const band of root.bands ?? []) {
    const key = band.id ?? band.name;
    const first = band.data?.values?.[0];
    if (key && typeof first === "number" && Number.isFinite(first)) {
      values[key] = first;
    }
  }

  return values;
}

export function extractStringArrayFromComputeValue(response: unknown): string[] {
  if (!response || typeof response !== "object") return [];
  const root = response as { result?: unknown; value?: unknown };

  const candidate = root.result ?? root.value;
  if (Array.isArray(candidate)) {
    return candidate.map(String);
  }
  if (typeof candidate === "string") {
    return [candidate];
  }
  return [];
}

export function parseCloudCoverFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const cloud = (metadata as { CLOUDY_PIXEL_PERCENTAGE?: number }).CLOUDY_PIXEL_PERCENTAGE;
  return typeof cloud === "number" && Number.isFinite(cloud) ? cloud : null;
}

/** Umbral heurístico para detectar posible escala DN — NO se aplica conversión automática */
export const LIKELY_DN_SCALE_MIN = 1.05;
export const LIKELY_DN_SCALE_MAX = 10000;

export type ReflectanceScaleInterpretation =
  | "confirmed_surface_reflectance_0_1"
  | "likely_dn_or_scaled"
  | "indeterminate";

export interface ReflectanceScaleEvidence {
  interpretation: ReflectanceScaleInterpretation;
  minObserved: number | null;
  maxObserved: number | null;
  sampleCount: number;
  /** Documentación empírica — sin conversión automática */
  notes: string[];
}

/** Reflectancia L2A esperada en factor 0–1 (COPERNICUS/S2_SR_HARMONIZED) */
export const SURFACE_REFLECTANCE_MAX = 1.0;
export const SURFACE_REFLECTANCE_TOLERANCE = 0.05;

export type ReflectanceSemanticStatus = "valid" | "out_of_range" | "missing" | "unknown";

export interface ProcessedGeeReflectance {
  reflectances: Sentinel2ReflectanceMap;
  semanticStatus: ReflectanceSemanticStatus;
  rawBandValues: Record<string, number>;
  scaleEvidence: ReflectanceScaleEvidence;
}

/**
 * Interpreta semántica de escala sin aplicar /10000 ni otras conversiones.
 * Evidencia empírica registrada en scaleEvidence.notes.
 */
export function interpretReflectanceScale(
  raw: Record<string, number>
): ReflectanceScaleEvidence {
  const finiteValues = Object.values(raw).filter((v) => Number.isFinite(v));
  const notes: string[] = [];

  if (finiteValues.length === 0) {
    return {
      interpretation: "indeterminate",
      minObserved: null,
      maxObserved: null,
      sampleCount: 0,
      notes: ["Sin valores finitos — escala indeterminada"],
    };
  }

  const minObserved = Math.min(...finiteValues);
  const maxObserved = Math.max(...finiteValues);
  const upperBound = SURFACE_REFLECTANCE_MAX + SURFACE_REFLECTANCE_TOLERANCE;

  if (finiteValues.every((v) => v >= 0 && v <= upperBound)) {
    notes.push(
      "Valores observados dentro de [0, 1+tolerance] — consistente con reflectancia de superficie 0–1"
    );
    return {
      interpretation: "confirmed_surface_reflectance_0_1",
      minObserved,
      maxObserved,
      sampleCount: finiteValues.length,
      notes,
    };
  }

  if (
    finiteValues.every((v) => v >= 0 && v <= LIKELY_DN_SCALE_MAX) &&
    finiteValues.some((v) => v > LIKELY_DN_SCALE_MIN)
  ) {
    notes.push(
      "Valores > 1 detectados — posible escala DN/reflectance×10000; NO se aplica conversión automática"
    );
    return {
      interpretation: "likely_dn_or_scaled",
      minObserved,
      maxObserved,
      sampleCount: finiteValues.length,
      notes,
    };
  }

  notes.push("Patrón de valores no clasificable con certeza — escala indeterminada");
  return {
    interpretation: "indeterminate",
    minObserved,
    maxObserved,
    sampleCount: finiteValues.length,
    notes,
  };
}

export interface GeeSceneDetailRow {
  sceneId: string;
  systemIndex: string;
  systemTimeStart: number | null;
  cloudPercentage: number | null;
}

/** Extrae filas de escena desde respuesta value:compute con ee.Dictionary */
export function extractSceneDetailsFromComputeValue(response: unknown): GeeSceneDetailRow[] {
  if (!response || typeof response !== "object") return [];

  const root = response as {
    result?: unknown;
    value?: unknown;
  };

  const candidate = root.result ?? root.value;
  if (!candidate || typeof candidate !== "object") return [];

  const dict = candidate as Record<string, unknown>;

  const indices = extractNumericOrStringArray(dict["system:index"] ?? dict.system_index);
  const times = extractNumericArray(dict["system:time_start"] ?? dict.system_time_start);
  const clouds = extractNumericArray(
    dict["CLOUDY_PIXEL_PERCENTAGE"] ?? dict.CLOUDY_PIXEL_PERCENTAGE
  );

  if (indices.length === 0) {
    const flatIds = extractStringArrayFromComputeValue(response);
    return flatIds.map((sceneId) => ({
      sceneId,
      systemIndex: sceneId,
      systemTimeStart: null,
      cloudPercentage: null,
    }));
  }

  const rows: GeeSceneDetailRow[] = [];
  const n = indices.length;

  for (let i = 0; i < n; i++) {
    const sceneId = String(indices[i]);
    const timeMs = times[i] ?? null;
    const cloud = clouds[i] ?? null;
    rows.push({
      sceneId,
      systemIndex: sceneId,
      systemTimeStart: timeMs,
      cloudPercentage: cloud !== null && Number.isFinite(cloud) ? cloud : null,
    });
  }

  return rows;
}

function extractNumericOrStringArray(value: unknown): Array<string | number> {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const wrapped = value as { values?: unknown[]; arrayValue?: { values?: unknown[] } };
    const arr = wrapped.values ?? wrapped.arrayValue?.values;
    if (Array.isArray(arr)) return arr as Array<string | number>;
  }
  return [];
}

function extractNumericArray(value: unknown): Array<number | null> {
  const raw = extractNumericOrStringArray(value);
  return raw.map((v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });
}

export function systemTimeStartToAcquisitionDate(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

export const GEE_QC_BAND_SCL = "SCL" as const;

export function separateReflectanceAndScl(raw: Record<string, number>): {
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
 * Valida reflectancias GEE sin inventar conversiones.
 * Valores fuera de [0, 1+tolerance] → out_of_range (no se calculan índices).
 */
export function processGeeSurfaceReflectances(
  raw: Record<string, number>
): ProcessedGeeReflectance {
  const scaleEvidence = interpretReflectanceScale(raw);

  if (Object.keys(raw).length === 0) {
    return {
      reflectances: {},
      semanticStatus: "missing",
      rawBandValues: raw,
      scaleEvidence,
    };
  }

  const finiteValues = Object.values(raw).filter((v) => Number.isFinite(v));
  if (finiteValues.length === 0) {
    return {
      reflectances: {},
      semanticStatus: "missing",
      rawBandValues: raw,
      scaleEvidence,
    };
  }

  if (finiteValues.some((v) => v < 0)) {
    return {
      reflectances: {},
      semanticStatus: "out_of_range",
      rawBandValues: raw,
      scaleEvidence,
    };
  }

  if (scaleEvidence.interpretation === "indeterminate") {
    return {
      reflectances: {},
      semanticStatus: "unknown",
      rawBandValues: raw,
      scaleEvidence,
    };
  }

  const upperBound = SURFACE_REFLECTANCE_MAX + SURFACE_REFLECTANCE_TOLERANCE;
  if (finiteValues.some((v) => v > upperBound)) {
    return {
      reflectances: {},
      semanticStatus: "out_of_range",
      rawBandValues: raw,
      scaleEvidence,
    };
  }

  return {
    reflectances: mapGeeReflectances(raw),
    semanticStatus: "valid",
    rawBandValues: raw,
    scaleEvidence,
  };
}
