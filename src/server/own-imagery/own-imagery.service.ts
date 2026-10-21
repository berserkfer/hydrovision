/**
 * Servicio de imágenes propias (dron o campo). Registros separados de los datos satelitales:
 * `source: "imagen_propia"`, almacenamiento propio, exportación propia. Ningún módulo de
 * calibración ni de métricas importa este servicio.
 */

import { randomUUID } from "node:crypto";
import { readJson, removeData, writeBinary, writeJson } from "@/server/storage/file-store";
import { distanceMeters, type LatLon } from "@/satellite/geo/projection";
import {
  OWN_IMAGE_SOURCE,
  type OwnImageKind,
  type OwnImageRecord,
} from "@/own-imagery/own-imagery.types";
import {
  DEFAULT_OWN_IMAGE_WINDOW_M,
  OwnImageError,
  getOwnImageMaxBytes,
  processGeoTiff,
  processPhoto,
} from "./own-imagery.processing";

const RECORDS = "imagenes-propias/records.json";

export function detectOwnImageKind(bytes: Uint8Array): OwnImageKind | null {
  if (bytes.length < 4) return null;
  const [a, b, c, d] = bytes;
  if ((a === 0x49 && b === 0x49 && c === 0x2a && d === 0x00) || (a === 0x4d && b === 0x4d && c === 0x00 && d === 0x2a)) {
    return "geotiff";
  }
  if ((a === 0x49 && b === 0x49 && c === 0x2b) || (a === 0x4d && b === 0x4d && d === 0x2b)) return "geotiff"; // BigTIFF
  if (a === 0xff && b === 0xd8) return "foto"; // JPEG
  if (a === 0x89 && b === 0x50 && c === 0x4e && d === 0x47) return "foto"; // PNG
  return null;
}

export async function listOwnImages(): Promise<OwnImageRecord[]> {
  return readJson<OwnImageRecord[]>(RECORDS, []);
}

export interface CreateOwnImageInput {
  fileName: string;
  bytes: Uint8Array;
  target: { label: string } & LatLon;
  windowM?: number;
  manualCamera?: LatLon | null;
  uploadedBy: string | null;
}

export async function createOwnImage(input: CreateOwnImageInput): Promise<OwnImageRecord> {
  if (input.bytes.length > getOwnImageMaxBytes()) {
    throw new OwnImageError(`El archivo supera el máximo de ${(getOwnImageMaxBytes() / 1_000_000).toFixed(0)} MB.`);
  }
  const kind = detectOwnImageKind(input.bytes);
  if (!kind) throw new OwnImageError("Formato no admitido: suba un GeoTIFF (.tif) o una foto JPEG/PNG.");

  const windowM = Math.min(Math.max(input.windowM ?? DEFAULT_OWN_IMAGE_WINDOW_M, 5), 200);
  const target = { latitude: input.target.latitude, longitude: input.target.longitude };
  const processed =
    kind === "geotiff"
      ? await processGeoTiff(
          input.bytes.buffer.slice(input.bytes.byteOffset, input.bytes.byteOffset + input.bytes.byteLength) as ArrayBuffer,
          target,
          windowM
        )
      : await processPhoto(Buffer.from(input.bytes), target, input.manualCamera ?? null);

  const id = randomUUID();
  const ext = kind === "geotiff" ? "tif" : input.bytes[0] === 0xff ? "jpg" : "png";
  await writeBinary(`imagenes-propias/files/${id}.${ext}`, input.bytes);

  const record: OwnImageRecord = {
    id,
    source: OWN_IMAGE_SOURCE,
    kind,
    fileName: input.fileName.slice(0, 160),
    sizeBytes: input.bytes.length,
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
    target: { label: input.target.label.slice(0, 80), ...target },
    ...processed,
  };
  const records = await listOwnImages();
  records.unshift(record);
  await writeJson(RECORDS, records);
  return record;
}

export async function deleteOwnImage(id: string): Promise<boolean> {
  const records = await listOwnImages();
  const record = records.find((r) => r.id === id);
  if (!record) return false;
  await writeJson(RECORDS, records.filter((r) => r.id !== id));
  for (const ext of ["tif", "jpg", "png"]) {
    await removeData(`imagenes-propias/files/${id}.${ext}`).catch(() => {});
  }
  return true;
}

/** Imágenes propias asociadas a un punto (≤ radio del objetivo): para columnas separadas. */
export function ownImagesNear(records: OwnImageRecord[], point: LatLon, radiusM = 30): OwnImageRecord[] {
  return records.filter((r) => distanceMeters(point, r.target) <= radiusM);
}

/** Resumen para la columna separada "imagen propia" de otras tablas y exportaciones. */
export function ownImageColumn(records: OwnImageRecord[]): { count: number; latest: string | null } {
  if (records.length === 0) return { count: 0, latest: null };
  const r = records[0];
  const signal = r.bands
    .filter((b) => b.mean !== null)
    .map((b) => `${b.name}=${b.mean}`)
    .join(" ");
  return { count: records.length, latest: `${r.kind} ${r.uploadedAt.slice(0, 10)} ${signal}`.trim() };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ownImagesToCsv(records: OwnImageRecord[]): string {
  const bandNames = [...new Set(records.flatMap((r) => r.bands.map((b) => b.name)))];
  const header = [
    "fuente",
    "id",
    "tipo",
    "archivo",
    "objetivo",
    "latitud_objetivo",
    "longitud_objetivo",
    "georreferencia",
    "crs",
    "resolucion_m",
    "distancia_camara_m",
    "recorte",
    "ventana_m",
    "fecha_captura",
    "subido",
    ...bandNames.flatMap((b) => [`${b}_media`, `${b}_desv`, `${b}_pixeles`]),
  ];
  const rows = records.map((r) => {
    const byName = new Map(r.bands.map((b) => [b.name, b]));
    return [
      r.source,
      r.id,
      r.kind,
      r.fileName,
      r.target.label,
      r.target.latitude,
      r.target.longitude,
      r.georef.method,
      r.georef.crs,
      r.georef.resolutionM,
      r.georef.distanceToTargetM,
      r.crop.method,
      r.crop.windowM,
      r.capturedAt,
      r.uploadedAt,
      ...bandNames.flatMap((b) => {
        const s = byName.get(b);
        return [s?.mean ?? null, s?.std ?? null, s?.validPixels ?? null];
      }),
    ]
      .map(csvCell)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n") + "\n";
}
