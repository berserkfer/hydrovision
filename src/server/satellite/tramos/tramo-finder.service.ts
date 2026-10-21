/**
 * Buscador de tramos del Dren 4000 aptos para Sentinel-2 (trabajo en segundo plano).
 *
 * 1. Traza: la subida por el usuario (GeoJSON) o la poligonal P1 → P5 por defecto.
 * 2. Muestreo cada 50 m (o rejilla de 50 m dentro de un polígono).
 * 3. Escenas: las N más recientes de Sentinel-2 L2A en Planetary Computer (por defecto 6).
 * 4. Por escena, UNA lectura por banda (B03, B08, SCL) que cubre toda la traza; cada muestra se
 *    evalúa sobre esa rejilla con la selección del píxel de agua.
 * 5. Por tramo: frecuencia de aptitud, f_agua media, coordenadas (UTM 17S y geográficas),
 *    distancia al punto histórico más cercano; P6–P10 se evalúan aparte como referencia.
 */

import { createHash } from "node:crypto";
import { readJson, writeJson, removeData } from "@/server/storage/file-store";
import { searchSentinel2Items, getSentinel2ItemById } from "@/server/planetary/pc-stac.client";
import { readBandAtCrsPoints, readBandBboxGrid } from "@/server/planetary/pc-band-reader";
import { convertDnToReflectance, resolveBoaOffset } from "@/server/planetary/pc-band.mapper";
import { parseGeoJson, type ParsedGeometry } from "@/satellite/geo/geojson";
import {
  DEFAULT_SAMPLE_SPACING_M,
  REFERENCE_POINT_CODES,
  boundingBox,
  defaultTrace,
  historicalPoints,
  sampleTrace,
  traceFromGeometry,
  traceLengthM,
  type Trace,
  type TraceSample,
} from "@/satellite/geo/trace";
import {
  aggregateCandidate,
  evaluateSampleInScene,
  rankCandidates,
  type SampleSceneResult,
  type SceneGrid,
  type TramoCandidate,
} from "@/satellite/tramos/tramo-suitability";
import { CLOUD_MODE_LABELS, getCloudMode, getWaterSearchRadiusM, type CloudMode } from "@/satellite/quality/water-pixel-selection";

export const TRAMO_FINDER_JOB = "tramo-finder";
const TRACE_FILE = "tramos/trace.json";
const PROPOSALS_FILE = "tramos/proposals.json";

export function getTramoSceneCount(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number.parseInt(env.TRAMO_FINDER_SCENES ?? "", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 12) : 6;
}

// ─── Traza subida ───────────────────────────────────────────────────────────────────────

export interface StoredTrace {
  name: string;
  uploadedAt: string;
  uploadedBy: string | null;
  hash: string;
  geometry: ParsedGeometry;
}

export async function getStoredTrace(): Promise<StoredTrace | null> {
  return readJson<StoredTrace | null>(TRACE_FILE, null);
}

/** Valida y guarda un GeoJSON de línea o polígono como traza. Lanza GeoJsonValidationError. */
export async function saveUploadedTrace(text: string, name: string, uploadedBy: string | null): Promise<StoredTrace> {
  const geometry = parseGeoJson(text);
  const stored: StoredTrace = {
    name: name.slice(0, 120) || "traza.geojson",
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    hash: createHash("sha256").update(JSON.stringify(geometry)).digest("hex").slice(0, 12),
    geometry,
  };
  await writeJson(TRACE_FILE, stored);
  return stored;
}

export async function clearUploadedTrace(): Promise<void> {
  await removeData(TRACE_FILE);
}

export async function resolveTrace(): Promise<{ trace: Trace; traceKey: string; name: string | null }> {
  const stored = await getStoredTrace();
  if (!stored) return { trace: defaultTrace(), traceKey: "default", name: null };
  return { trace: traceFromGeometry(stored.geometry, stored.name), traceKey: stored.hash, name: stored.name };
}

// ─── Propuestas ─────────────────────────────────────────────────────────────────────────

export interface ProposalMark {
  proposed: boolean;
  at: string;
  by: string | null;
}

type ProposalStore = Record<string, ProposalMark>;

export function proposalKey(traceKey: string, candidateId: string): string {
  return `${traceKey}|${candidateId}`;
}

export async function getProposals(): Promise<ProposalStore> {
  return readJson<ProposalStore>(PROPOSALS_FILE, {});
}

export async function setProposal(traceKey: string, candidateId: string, proposed: boolean, by: string | null) {
  const store = await getProposals();
  store[proposalKey(traceKey, candidateId)] = { proposed, at: new Date().toISOString(), by };
  await writeJson(PROPOSALS_FILE, store);
  return store[proposalKey(traceKey, candidateId)];
}

// ─── Cálculo ────────────────────────────────────────────────────────────────────────────

export interface TramoSceneInfo {
  sceneId: string;
  acquisitionDate: string;
  cloudPercentage: number | null;
  epsg: number | null;
  status: "read" | "unreadable";
}

export interface TramoFinderResult {
  traceKey: string;
  trace: {
    source: Trace["source"];
    description: string;
    name: string | null;
    lengthM: number;
    samples: number;
    spacingM: number;
  };
  scenes: TramoSceneInfo[];
  searchRadiusM: number;
  cloudMode: CloudMode;
  candidates: TramoCandidate[];
  references: TramoCandidate[];
  notes: string[];
}

export interface TramoFinderDeps {
  findScenes: (center: { latitude: number; longitude: number }, count: number) => Promise<Array<{ id: string; date: string; cloud: number | null }>>;
  readSceneGrid: (
    sceneId: string,
    min: { latitude: number; longitude: number },
    max: { latitude: number; longitude: number }
  ) => Promise<SceneGrid | null>;
}

async function defaultFindScenes(center: { latitude: number; longitude: number }, count: number) {
  const end = new Date();
  const start = new Date(end.getTime() - 180 * 86_400_000);
  const items = await searchSentinel2Items({
    latitude: center.latitude,
    longitude: center.longitude,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    cloudCoverMax: 40,
    limit: 24,
  });
  return items.slice(0, count).map((item) => ({
    id: item.id,
    date: item.properties.datetime.slice(0, 10),
    cloud: item.properties["eo:cloud_cover"] ?? null,
  }));
}

async function defaultReadSceneGrid(
  sceneId: string,
  min: { latitude: number; longitude: number },
  max: { latitude: number; longitude: number }
): Promise<SceneGrid | null> {
  const item = await getSentinel2ItemById(sceneId);
  if (!item) return null;
  const href = (band: string) => item.assets[band]?.href;
  const greenHref = href("B03");
  const nirHref = href("B08");
  const sclHref = href("SCL");
  if (!greenHref || !nirHref || !sclHref) return null;

  const [green, nir] = await Promise.all([
    readBandBboxGrid(greenHref, min, max),
    readBandBboxGrid(nirHref, min, max),
  ]);
  if (!green || !nir || green.width !== nir.width || green.height !== nir.height) return null;

  const centers = [];
  for (let r = 0; r < green.height; r += 1) {
    for (let c = 0; c < green.width; c += 1) {
      centers.push({
        x: green.originX + (c + 0.5) * green.resolutionMeters,
        y: green.originY - (r + 0.5) * green.resolutionMeters,
      });
    }
  }
  const scl = await readBandAtCrsPoints(sclHref, centers);
  if (!scl) return null;

  const offset = resolveBoaOffset(item.properties["s2:processing_baseline"]);
  const toRefl = (v: number | null) => (v === null ? null : convertDnToReflectance(v, offset));
  return {
    sceneId,
    acquisitionDate: item.properties.datetime.slice(0, 10),
    cloudPercentage: item.properties["eo:cloud_cover"] ?? null,
    epsg: green.epsg,
    pixelSizeM: green.resolutionMeters,
    originX: green.originX,
    originY: green.originY,
    width: green.width,
    height: green.height,
    green: green.values.map(toRefl),
    nir: nir.values.map(toRefl),
    scl,
  };
}

const defaultDeps: TramoFinderDeps = { findScenes: defaultFindScenes, readSceneGrid: defaultReadSceneGrid };

export async function runTramoFinder(
  options: { onProgress?: (p: { done: number; total: number; message?: string }) => void } = {},
  deps: TramoFinderDeps = defaultDeps
): Promise<TramoFinderResult> {
  const { trace, traceKey, name } = await resolveTrace();
  const samples = sampleTrace(trace, DEFAULT_SAMPLE_SPACING_M);
  if (samples.length === 0) throw new Error("La traza no produjo puntos de muestreo.");

  const historical = historicalPoints();
  const references: TraceSample[] = historical
    .filter((h) => (REFERENCE_POINT_CODES as readonly string[]).includes(h.codigo))
    .map((h) => ({ id: h.codigo, coordinate: h.coordinate, chainageM: null }));

  const searchRadiusM = getWaterSearchRadiusM();
  const cloudMode = getCloudMode();
  const allPoints = [...samples, ...references].map((s) => s.coordinate);
  // Margen: radio de búsqueda + ventana 3×3 + un píxel de holgura.
  const { min, max } = boundingBox(allPoints, searchRadiusM + 30);
  const center = { latitude: (min.latitude + max.latitude) / 2, longitude: (min.longitude + max.longitude) / 2 };

  const sceneCount = getTramoSceneCount();
  options.onProgress?.({ done: 0, total: sceneCount, message: "Buscando escenas" });
  const found = await deps.findScenes(center, sceneCount);
  if (found.length === 0) throw new Error("No se encontraron escenas Sentinel-2 recientes con nubosidad ≤ 40 %.");

  const perSample = new Map<string, SampleSceneResult[]>();
  const sceneInfo: TramoSceneInfo[] = [];

  for (const [i, scene] of found.entries()) {
    options.onProgress?.({ done: i, total: found.length, message: `Escena ${scene.date}` });
    const grid = await deps.readSceneGrid(scene.id, min, max);
    sceneInfo.push({
      sceneId: scene.id,
      acquisitionDate: scene.date,
      cloudPercentage: scene.cloud,
      epsg: grid?.epsg ?? null,
      status: grid ? "read" : "unreadable",
    });
    if (!grid) continue;
    for (const sample of [...samples, ...references]) {
      const result = evaluateSampleInScene(grid, sample.coordinate, { searchRadiusM, cloudMode });
      perSample.set(sample.id, [...(perSample.get(sample.id) ?? []), result]);
    }
  }
  options.onProgress?.({ done: found.length, total: found.length });

  if (!sceneInfo.some((s) => s.status === "read")) {
    throw new Error("Ninguna escena se pudo leer (Planetary Computer no respondió o el área quedó fuera del tile).");
  }

  const candidates = rankCandidates(
    samples.map((s) => aggregateCandidate(s, "tramo", perSample.get(s.id) ?? [], historical))
  );
  const referenceCandidates = references.map((r) =>
    aggregateCandidate(r, "referencia", perSample.get(r.id) ?? [], historical)
  );

  const notes = [
    `Criterio de aptitud por escena: SCL = 6 y NDWI > 0, ventana 3×3, ≥ 3 píxeles de agua conectados y f_agua ≥ 0,5, con ajuste ≤ ${searchRadiusM} m dentro del cauce.`,
    "Frecuencia de aptitud = escenas aptas / escenas con datos en el tramo (las descartadas por nubes cuentan como no aptas).",
    `Regla de nubes: ${CLOUD_MODE_LABELS[cloudMode]} (WATER_PIXEL_CLOUD_MODE).`,
    "Un tramo a ≤ 25 m de un punto de Nizama y Cabrera (2014) se marca como histórico; el resto, como nuevo.",
  ];
  if (trace.source === "default_points") {
    notes.push("Traza aproximada (rectas P1 → P5). Suba el eje real del dren en GeoJSON para un resultado más fiel.");
  }

  return {
    traceKey,
    trace: {
      source: trace.source,
      description: trace.description,
      name,
      lengthM: Math.round(traceLengthM(trace)),
      samples: samples.length,
      spacingM: DEFAULT_SAMPLE_SPACING_M,
    },
    scenes: sceneInfo,
    searchRadiusM,
    cloudMode,
    candidates,
    references: referenceCandidates,
    notes,
  };
}

// ─── Exportación ────────────────────────────────────────────────────────────────────────

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tramoCandidatesToCsv(result: TramoFinderResult, proposals: ProposalStore): string {
  const header = [
    "id",
    "rol",
    "origen",
    "punto_historico",
    "progresiva_m",
    "este_utm17s",
    "norte_utm17s",
    "latitud",
    "longitud",
    "escenas_evaluadas",
    "escenas_aptas",
    "escenas_descartadas_nubes",
    "frecuencia_aptitud",
    "f_agua_media",
    "historico_mas_cercano",
    "distancia_historico_m",
    "propuesto",
  ];
  const rows = [...result.candidates, ...result.references].map((c) =>
    [
      c.id,
      c.role,
      c.origin,
      c.historicalCode,
      c.chainageM,
      c.utm17s.easting,
      c.utm17s.northing,
      c.coordinate.latitude,
      c.coordinate.longitude,
      c.scenesEvaluated,
      c.scenesApt,
      c.scenesDiscardedClouds,
      c.aptitudeFrequency,
      c.meanWaterFraction,
      c.nearestHistorical.codigo,
      c.nearestHistorical.distanceM,
      proposals[proposalKey(result.traceKey, c.id)]?.proposed ? "si" : "no",
    ]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}
