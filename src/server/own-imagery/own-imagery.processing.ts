/**
 * Procesamiento de imágenes propias: recorte a la ventana del punto y señal promedio por banda.
 *
 * - GeoTIFF georreferenciado (UTM WGS84 o geográficas EPSG:4326): recorte GEOGRÁFICO de
 *   `windowM` metros (por defecto 30 m, como la ventana 3×3 de Sentinel-2) centrado en el punto.
 *   Si el ráster es muy fino (dron de cm) se lee remuestreado a ≤ 1000 px por lado.
 * - Foto JPEG/PNG: sin georreferencia por píxel. Se toma la posición de la cámara del EXIF GPS
 *   (o la que indique el usuario) y se recorta el CENTRO de la imagen; queda declarado.
 *
 * Los valores son del sensor (DN o 0–255), no reflectancia: solo para comparación visual.
 */

import { fromArrayBuffer } from "geotiff";
import { distanceMeters, isUtmWgs84Epsg, toUtm, type LatLon } from "@/satellite/geo/projection";
import type { OwnImageBandStats, OwnImageRecord } from "@/own-imagery/own-imagery.types";

export const DEFAULT_OWN_IMAGE_WINDOW_M = 30;
export const PHOTO_CENTER_FRACTION = 0.4;
const MAX_READ_SIDE_PX = 1000;

export class OwnImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnImageError";
  }
}

export function getOwnImageMaxBytes(env: NodeJS.ProcessEnv = process.env): number {
  const v = Number.parseInt(env.OWN_IMAGE_MAX_BYTES ?? "", 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, 500_000_000) : 50_000_000;
}

/** Media, desviación, mínimo y máximo de los valores válidos (ignora nodata y no finitos). */
export function bandStats(name: string, values: ArrayLike<number>, nodata: number | null = null): OwnImageBandStats {
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (!Number.isFinite(v) || (nodata !== null && v === nodata)) continue;
    n += 1;
    sum += v;
    sumSq += v * v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (n === 0) return { name, mean: null, std: null, min: null, max: null, validPixels: 0 };
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const r = (x: number) => Number(x.toFixed(4));
  return { name, mean: r(mean), std: r(Math.sqrt(variance)), min: r(min), max: r(max), validPixels: n };
}

// ─── EXIF GPS (lector mínimo: solo lo necesario para posición y fecha) ──────────────────

export interface ExifGps {
  latitude: number;
  longitude: number;
  capturedAt: string | null;
}

/** Lee GPS y DateTimeOriginal de un bloque EXIF (con o sin prefijo "Exif\0\0"). */
export function parseExifGps(raw: Uint8Array | null | undefined): ExifGps | null {
  if (!raw || raw.length < 14) return null;
  let start = 0;
  if (raw[0] === 0x45 && raw[1] === 0x78 && raw[2] === 0x69 && raw[3] === 0x66) start = 6; // "Exif\0\0"
  const view = new DataView(raw.buffer, raw.byteOffset + start, raw.byteLength - start);
  const order = view.getUint16(0);
  const little = order === 0x4949;
  if (!little && order !== 0x4d4d) return null;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);

  const readIfd = (offset: number) => {
    const entries = new Map<number, { type: number; count: number; valueOffset: number }>();
    if (offset + 2 > view.byteLength) return entries;
    const n = u16(offset);
    for (let i = 0; i < n; i += 1) {
      const e = offset + 2 + i * 12;
      if (e + 12 > view.byteLength) break;
      entries.set(u16(e), { type: u16(e + 2), count: u32(e + 4), valueOffset: e + 8 });
    }
    return entries;
  };
  const rationals = (entry: { count: number; valueOffset: number }) => {
    const ptr = u32(entry.valueOffset);
    const out: number[] = [];
    for (let i = 0; i < entry.count; i += 1) {
      const den = u32(ptr + i * 8 + 4);
      out.push(den === 0 ? Number.NaN : u32(ptr + i * 8) / den);
    }
    return out;
  };
  const ascii = (entry: { count: number; valueOffset: number }) => {
    const ptr = entry.count > 4 ? u32(entry.valueOffset) : entry.valueOffset;
    let s = "";
    for (let i = 0; i < entry.count; i += 1) {
      const c = view.getUint8(ptr + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  };

  try {
    const ifd0 = readIfd(u32(4));
    const gpsPtr = ifd0.get(0x8825);
    if (!gpsPtr) return null;
    const gps = readIfd(u32(gpsPtr.valueOffset));
    const latRef = gps.get(1);
    const lat = gps.get(2);
    const lonRef = gps.get(3);
    const lon = gps.get(4);
    if (!lat || !lon) return null;
    const dms = (v: number[]) => v[0] + v[1] / 60 + v[2] / 3600;
    const latitude = dms(rationals(lat)) * (latRef && ascii(latRef) === "S" ? -1 : 1);
    const longitude = dms(rationals(lon)) * (lonRef && ascii(lonRef) === "W" ? -1 : 1);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    let capturedAt: string | null = null;
    const exifPtr = ifd0.get(0x8769);
    if (exifPtr) {
      const dt = readIfd(u32(exifPtr.valueOffset)).get(0x9003);
      const text = dt ? ascii(dt) : "";
      const m = text.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (m) capturedAt = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
    }
    return { latitude, longitude, capturedAt };
  } catch {
    return null;
  }
}

// ─── GeoTIFF ────────────────────────────────────────────────────────────────────────────

type ProcessedImage = Pick<OwnImageRecord, "georef" | "crop" | "bands" | "notes" | "capturedAt">;

export async function processGeoTiff(buffer: ArrayBuffer, target: LatLon, windowM: number): Promise<ProcessedImage> {
  let tiff;
  try {
    tiff = await fromArrayBuffer(buffer);
  } catch {
    throw new OwnImageError("El archivo no es un GeoTIFF legible.");
  }
  const image = await tiff.getImage();
  const keys = (image.getGeoKeys() ?? {}) as { ProjectedCSTypeGeoKey?: number; GeographicTypeGeoKey?: number };
  const bbox = image.getBoundingBox();
  const [resX, resY] = image.getResolution();
  const pxW = Math.abs(resX);
  const pxH = Math.abs(resY);

  let x: number;
  let y: number;
  let halfX: number;
  let halfY: number;
  let crs: string;
  let resolutionM: number;
  if (keys.ProjectedCSTypeGeoKey && isUtmWgs84Epsg(keys.ProjectedCSTypeGeoKey)) {
    const p = toUtm(target, keys.ProjectedCSTypeGeoKey);
    x = p.easting;
    y = p.northing;
    halfX = halfY = windowM / 2;
    crs = `EPSG:${keys.ProjectedCSTypeGeoKey}`;
    resolutionM = pxW;
  } else if (!keys.ProjectedCSTypeGeoKey && keys.GeographicTypeGeoKey === 4326) {
    x = target.longitude;
    y = target.latitude;
    halfY = windowM / 2 / 111_320;
    halfX = windowM / 2 / (111_320 * Math.cos((target.latitude * Math.PI) / 180));
    crs = "EPSG:4326";
    resolutionM = pxW * 111_320 * Math.cos((target.latitude * Math.PI) / 180);
  } else {
    throw new OwnImageError(
      "El GeoTIFF no está en un sistema admitido (UTM WGS84 o geográficas EPSG:4326). Reproyéctelo antes de subirlo."
    );
  }

  if (x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) {
    throw new OwnImageError("La imagen no cubre el punto elegido.");
  }

  const width = image.getWidth();
  const height = image.getHeight();
  const col0 = Math.max(0, Math.floor((x - halfX - bbox[0]) / pxW));
  const col1 = Math.min(width, Math.max(col0 + 1, Math.ceil((x + halfX - bbox[0]) / pxW)));
  const row0 = Math.max(0, Math.floor((bbox[3] - (y + halfY)) / pxH));
  const row1 = Math.min(height, Math.max(row0 + 1, Math.ceil((bbox[3] - (y - halfY)) / pxH)));
  const winW = col1 - col0;
  const winH = row1 - row0;
  const scale = Math.max(1, Math.max(winW, winH) / MAX_READ_SIDE_PX);
  const outW = Math.max(1, Math.round(winW / scale));
  const outH = Math.max(1, Math.round(winH / scale));

  const rasters = (await image.readRasters({
    window: [col0, row0, col1, row1],
    ...(scale > 1 ? { width: outW, height: outH, resampleMethod: "nearest" } : {}),
  })) as unknown as Array<ArrayLike<number>>;
  const nodataRaw = image.getGDALNoData();
  const nodata = nodataRaw === null || nodataRaw === undefined ? null : Number(nodataRaw);
  const bands = rasters.map((values, i) => bandStats(`banda_${i + 1}`, values, nodata));

  const notes = [
    `Recorte geográfico de ${windowM} m centrado en el punto (${crs}, píxel ≈ ${resolutionM.toFixed(3)} m).`,
    "Valores del sensor (DN), no reflectancia de superficie.",
  ];
  if (scale > 1) notes.push(`Leído remuestreado a ${outW}×${outH} px (vecino más cercano) por la resolución fina.`);
  if (bands.length === 3 || bands.length === 4) notes.push("Si es una imagen RGB(A): banda_1 = R, banda_2 = G, banda_3 = B.");

  return {
    capturedAt: null,
    georef: { method: "geotiff", crs, resolutionM: Number(resolutionM.toFixed(4)), cameraCoordinate: null, distanceToTargetM: null },
    crop: { method: "ventana_geografica", windowM, widthPx: outW, heightPx: outH },
    bands,
    notes,
  };
}

// ─── Fotos ──────────────────────────────────────────────────────────────────────────────

export async function processPhoto(
  buffer: Buffer,
  target: LatLon,
  manualCamera: LatLon | null
): Promise<ProcessedImage> {
  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new OwnImageError("El servidor no tiene el decodificador de imágenes (sharp) instalado.");
  }

  const img = sharp(buffer, { failOn: "error" }).rotate();
  let meta;
  try {
    meta = await img.metadata();
  } catch {
    throw new OwnImageError("No se pudo leer la foto (formato no admitido o archivo dañado).");
  }
  const exif = parseExifGps(meta.exif ?? null);
  const camera = exif ?? (manualCamera ? { ...manualCamera, capturedAt: null } : null);
  if (!camera) {
    throw new OwnImageError(
      "La foto no tiene GPS en el EXIF. Indique la latitud y longitud donde se tomó para poder asociarla al tramo."
    );
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) throw new OwnImageError("La foto no tiene dimensiones válidas.");
  // Con autorotación, ancho/alto pueden intercambiarse (orientaciones 5–8).
  const rotated = (meta.orientation ?? 1) >= 5;
  const w = rotated ? height : width;
  const h = rotated ? width : height;
  const side = Math.max(1, Math.round(Math.min(w, h) * PHOTO_CENTER_FRACTION));
  const left = Math.floor((w - side) / 2);
  const top = Math.floor((h - side) / 2);

  const { data, info } = await img
    .extract({ left, top, width: side, height: side })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const names = channels >= 3 ? ["R", "G", "B"] : ["gris"];
  const bands = names.map((name, c) => {
    const values = new Float64Array(info.width * info.height);
    for (let i = 0; i < values.length; i += 1) values[i] = data[i * channels + c];
    return bandStats(name, values);
  });

  const cameraCoordinate = { latitude: camera.latitude, longitude: camera.longitude };
  const distance = Number(distanceMeters(cameraCoordinate, target).toFixed(1));
  return {
    capturedAt: camera.capturedAt,
    georef: {
      method: exif ? "exif_gps" : "manual",
      crs: "EPSG:4326",
      resolutionM: null,
      cameraCoordinate,
      distanceToTargetM: distance,
    },
    crop: { method: "centro_imagen", windowM: null, widthPx: side, heightPx: side },
    bands,
    notes: [
      `Foto sin georreferencia por píxel: se recortó el ${Math.round(PHOTO_CENTER_FRACTION * 100)} % central de la imagen.`,
      `Cámara a ${distance} m del punto (${exif ? "GPS del EXIF" : "posición indicada por el usuario"}).`,
      "Valores RGB de la cámara (0–255), no reflectancia.",
    ],
  };
}
