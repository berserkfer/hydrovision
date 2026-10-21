/**
 * Lectura de un valor de banda real desde un COG (Cloud-Optimized GeoTIFF) de Sentinel-2 L2A,
 * vía HTTP range requests — sin descargar la imagen completa. Reproyecta WGS84 → la CRS
 * proyectada del raster (normalmente UTM) con proj4, según el EPSG reportado por el propio
 * COG (nunca asumido/hardcodeado a una zona fija).
 */

import proj4 from "proj4";
import { fromUrl, type GeoTIFFImage } from "geotiff";
import { signAssetHref } from "./pc-sign.client";
import { withPlanetarySlot, withRetry } from "./pc-request-pool";

export interface BandPixelReadResult {
  rawValue: number;
  epsg: number;
  resolutionMeters: number;
}

const WGS84 = "EPSG:4326";

function utmProj4Def(epsg: number): string {
  // EPSG:326xx = UTM zone xx Norte, EPSG:327xx = UTM zone xx Sur (WGS84)
  const zone = epsg % 100;
  const hemisphere = epsg >= 32700 ? "+south" : "";
  return `+proj=utm +zone=${zone} ${hemisphere} +datum=WGS84 +units=m +no_defs`.trim();
}

async function attemptReadBandPixelAtPoint(
  signedHref: string,
  latitude: number,
  longitude: number
): Promise<BandPixelReadResult | null> {
  const tiff = await fromUrl(signedHref);
  const image: GeoTIFFImage = await tiff.getImage();

  const geoKeys = image.getGeoKeys() as { ProjectedCSTypeGeoKey?: number } | undefined;
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (!epsg) return null;

  const [x, y] = proj4(WGS84, utmProj4Def(epsg), [longitude, latitude]);

  const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY] en la CRS del raster
  const [resX] = image.getResolution();

  if (x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) {
    return null; // punto fuera de esta escena/tile — reintentar no cambiaría esto
  }

  const col = Math.floor((x - bbox[0]) / resX);
  const row = Math.floor((bbox[3] - y) / resX);

  const data = await image.readRasters({ window: [col, row, col + 1, row + 1] });
  const rawValue = (data[0] as unknown as ArrayLike<number>)[0];

  if (rawValue === undefined || !Number.isFinite(rawValue)) return null;

  return { rawValue, epsg, resolutionMeters: Math.abs(resX) };
}

export interface BandWindowReadResult {
  rawValues: number[];
  epsg: number;
  resolutionMeters: number;
}

async function attemptReadBandWindowAtPoint(
  signedHref: string,
  latitude: number,
  longitude: number,
  windowSize: number
): Promise<BandWindowReadResult | null> {
  const tiff = await fromUrl(signedHref);
  const image: GeoTIFFImage = await tiff.getImage();

  const geoKeys = image.getGeoKeys() as { ProjectedCSTypeGeoKey?: number } | undefined;
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (!epsg) return null;

  const [x, y] = proj4(WGS84, utmProj4Def(epsg), [longitude, latitude]);

  const bbox = image.getBoundingBox();
  const [resX] = image.getResolution();

  if (x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) {
    return null;
  }

  const col = Math.floor((x - bbox[0]) / resX);
  const row = Math.floor((bbox[3] - y) / resX);

  const half = Math.floor(windowSize / 2);
  const col0 = Math.max(0, col - half);
  const row0 = Math.max(0, row - half);
  const col1 = Math.min(image.getWidth(), col + half + 1);
  const row1 = Math.min(image.getHeight(), row + half + 1);

  if (col1 <= col0 || row1 <= row0) return null;

  const data = await image.readRasters({ window: [col0, row0, col1, row1] });
  const values = Array.from(data[0] as unknown as ArrayLike<number>);

  if (values.length === 0) return null;

  return { rawValues: values, epsg, resolutionMeters: Math.abs(resX) };
}

/**
 * Lee una ventana cuadrada de píxeles (por defecto 3×3) alrededor del punto.
 * Se usa para calcular la fracción de agua: un solo píxel no permite distinguir
 * agua pura de una mezcla con la orilla.
 */
export async function readBandWindowAtPoint(
  assetHref: string,
  latitude: number,
  longitude: number,
  windowSize = 3
): Promise<BandWindowReadResult | null> {
  try {
    return await withRetry(
      async () => {
        // La firma toma su propio turno (y suele venir de caché); la lectura del COG toma
        // otro. Nunca se anidan turnos: anidarlos podría bloquear el cupo.
        const signedHref = await signAssetHref(assetHref);
        return withPlanetarySlot(() =>
          attemptReadBandWindowAtPoint(signedHref, latitude, longitude, windowSize)
        );
      },
      { maxRetries: MAX_READ_RETRIES }
    );
  } catch {
    return null;
  }
}

// Cada lectura pasa por el cupo compartido de Planetary Computer (pc-request-pool.ts) y
// reintenta con espera exponencial + jitter: antes eran 2 intentos a 150 ms, que ante un
// límite de peticiones volvían a chocar casi de inmediato. La firma SAS ya viene cacheada,
// así que un reintento normalmente solo repite el range request al COG.
const MAX_READ_RETRIES = 2;

/**
 * Lee el valor crudo (DN) de un único píxel en (latitude, longitude) desde un asset de banda,
 * vía HTTP range request contra el COG firmado. Reintenta unas pocas veces con backoff corto
 * ante fallos de red/firma/parseo transitorios (comunes al leer bandas individuales de Azure
 * Blob Storage) — un fallo puntual en UNA banda no debe descartar silenciosamente esa banda de
 * toda la observación cuando un segundo intento sí habría funcionado.
 *
 * NUNCA inventa un valor: si el punto cae fuera del raster (no es un error, no se reintenta) o
 * todos los intentos fallan por una excepción real, retorna null.
 */
export async function readBandPixelAtPoint(
  assetHref: string,
  latitude: number,
  longitude: number
): Promise<BandPixelReadResult | null> {
  try {
    return await withRetry(
      async () => {
        const signedHref = await signAssetHref(assetHref);
        return withPlanetarySlot(() => attemptReadBandPixelAtPoint(signedHref, latitude, longitude));
      },
      { maxRetries: MAX_READ_RETRIES }
    );
  } catch {
    return null;
  }
}

// ─── Rejillas para la selección del píxel de agua ───────────────────────────────────────

/** Coordenada en la CRS proyectada del raster (UTM, metros). */
export interface CrsPoint {
  x: number;
  y: number;
}

/**
 * Rejilla (2·half+1)² de valores crudos centrada en el píxel que contiene el punto.
 * Las celdas fuera del raster quedan en null (nunca se rellenan con un valor inventado).
 * `cellCenters[r][c]` es el centro de cada píxel en la CRS del raster.
 */
export interface BandGridReadResult {
  values: Array<Array<number | null>>;
  cellCenters: CrsPoint[][];
  epsg: number;
  resolutionMeters: number;
}

export function wgs84ToCrs(epsg: number, latitude: number, longitude: number): CrsPoint {
  const [x, y] = proj4(WGS84, utmProj4Def(epsg), [longitude, latitude]);
  return { x, y };
}

export function crsToWgs84(epsg: number, point: CrsPoint): { latitude: number; longitude: number } {
  const [longitude, latitude] = proj4(utmProj4Def(epsg), WGS84, [point.x, point.y]);
  return { latitude, longitude };
}

async function attemptReadBandGrid(
  signedHref: string,
  latitude: number,
  longitude: number,
  half: number
): Promise<BandGridReadResult | null> {
  const tiff = await fromUrl(signedHref);
  const image: GeoTIFFImage = await tiff.getImage();
  const geoKeys = image.getGeoKeys() as { ProjectedCSTypeGeoKey?: number } | undefined;
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (!epsg) return null;

  const { x, y } = wgs84ToCrs(epsg, latitude, longitude);
  const bbox = image.getBoundingBox();
  const [resX] = image.getResolution();
  const res = Math.abs(resX);
  if (x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) return null;

  const col = Math.floor((x - bbox[0]) / res);
  const row = Math.floor((bbox[3] - y) / res);
  const size = 2 * half + 1;
  const col0 = Math.max(0, col - half);
  const row0 = Math.max(0, row - half);
  const col1 = Math.min(image.getWidth(), col + half + 1);
  const row1 = Math.min(image.getHeight(), row + half + 1);
  if (col1 <= col0 || row1 <= row0) return null;

  const data = await image.readRasters({ window: [col0, row0, col1, row1] });
  const flat = data[0] as unknown as ArrayLike<number>;
  const readWidth = col1 - col0;

  const values: Array<Array<number | null>> = [];
  const cellCenters: CrsPoint[][] = [];
  for (let r = 0; r < size; r += 1) {
    const rasterRow = row - half + r;
    const rowValues: Array<number | null> = [];
    const rowCenters: CrsPoint[] = [];
    for (let c = 0; c < size; c += 1) {
      const rasterCol = col - half + c;
      rowCenters.push({ x: bbox[0] + (rasterCol + 0.5) * res, y: bbox[3] - (rasterRow + 0.5) * res });
      const inside = rasterCol >= col0 && rasterCol < col1 && rasterRow >= row0 && rasterRow < row1;
      const v = inside ? flat[(rasterRow - row0) * readWidth + (rasterCol - col0)] : undefined;
      rowValues.push(v !== undefined && Number.isFinite(v) ? v : null);
    }
    values.push(rowValues);
    cellCenters.push(rowCenters);
  }
  return { values, cellCenters, epsg, resolutionMeters: res };
}

/** Rejilla de una banda alrededor del punto (cupo compartido + reintentos). */
export async function readBandGridAtPoint(
  assetHref: string,
  latitude: number,
  longitude: number,
  half: number
): Promise<BandGridReadResult | null> {
  try {
    return await withRetry(
      async () => {
        const signedHref = await signAssetHref(assetHref);
        return withPlanetarySlot(() => attemptReadBandGrid(signedHref, latitude, longitude, half));
      },
      { maxRetries: MAX_READ_RETRIES }
    );
  } catch {
    return null;
  }
}

async function attemptReadBandAtCrsPoints(
  signedHref: string,
  points: CrsPoint[]
): Promise<Array<number | null> | null> {
  const tiff = await fromUrl(signedHref);
  const image: GeoTIFFImage = await tiff.getImage();
  const bbox = image.getBoundingBox();
  const res = Math.abs(image.getResolution()[0]);
  const width = image.getWidth();
  const height = image.getHeight();

  const cells = points.map((p) => ({
    col: Math.floor((p.x - bbox[0]) / res),
    row: Math.floor((bbox[3] - p.y) / res),
  }));
  const inside = cells.filter((c) => c.col >= 0 && c.col < width && c.row >= 0 && c.row < height);
  if (inside.length === 0) return points.map(() => null);

  const col0 = Math.min(...inside.map((c) => c.col));
  const row0 = Math.min(...inside.map((c) => c.row));
  const col1 = Math.max(...inside.map((c) => c.col)) + 1;
  const row1 = Math.max(...inside.map((c) => c.row)) + 1;
  const data = await image.readRasters({ window: [col0, row0, col1, row1] });
  const flat = data[0] as unknown as ArrayLike<number>;
  const readWidth = col1 - col0;

  return cells.map((c) => {
    if (c.col < col0 || c.col >= col1 || c.row < row0 || c.row >= row1) return null;
    const v = flat[(c.row - row0) * readWidth + (c.col - col0)];
    return v !== undefined && Number.isFinite(v) ? v : null;
  });
}

/**
 * Valor de una banda (p. ej. SCL, 20 m) en el centro de cada píxel de otra rejilla (10 m):
 * cada punto toma el píxel que lo contiene, sin suponer que las rejillas están alineadas.
 */
export async function readBandAtCrsPoints(
  assetHref: string,
  points: CrsPoint[]
): Promise<Array<number | null> | null> {
  try {
    return await withRetry(
      async () => {
        const signedHref = await signAssetHref(assetHref);
        return withPlanetarySlot(() => attemptReadBandAtCrsPoints(signedHref, points));
      },
      { maxRetries: MAX_READ_RETRIES }
    );
  } catch {
    return null;
  }
}

/**
 * Rejilla de una banda que cubre una caja geográfica completa (una sola lectura por banda).
 * Valores crudos (DN) en orden fila-columna; origen = esquina noroeste de la celda [0][0].
 */
export interface BandBboxGrid {
  values: Array<number | null>;
  width: number;
  height: number;
  originX: number;
  originY: number;
  resolutionMeters: number;
  epsg: number;
}

async function attemptReadBandBboxGrid(
  signedHref: string,
  min: { latitude: number; longitude: number },
  max: { latitude: number; longitude: number }
): Promise<BandBboxGrid | null> {
  const tiff = await fromUrl(signedHref);
  const image: GeoTIFFImage = await tiff.getImage();
  const geoKeys = image.getGeoKeys() as { ProjectedCSTypeGeoKey?: number } | undefined;
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (!epsg) return null;

  const corners = [
    wgs84ToCrs(epsg, min.latitude, min.longitude),
    wgs84ToCrs(epsg, max.latitude, max.longitude),
    wgs84ToCrs(epsg, min.latitude, max.longitude),
    wgs84ToCrs(epsg, max.latitude, min.longitude),
  ];
  const bbox = image.getBoundingBox();
  const res = Math.abs(image.getResolution()[0]);
  const col0 = Math.max(0, Math.floor((Math.min(...corners.map((c) => c.x)) - bbox[0]) / res));
  const col1 = Math.min(image.getWidth(), Math.ceil((Math.max(...corners.map((c) => c.x)) - bbox[0]) / res));
  const row0 = Math.max(0, Math.floor((bbox[3] - Math.max(...corners.map((c) => c.y))) / res));
  const row1 = Math.min(image.getHeight(), Math.ceil((bbox[3] - Math.min(...corners.map((c) => c.y))) / res));
  if (col1 <= col0 || row1 <= row0) return null;

  const data = await image.readRasters({ window: [col0, row0, col1, row1] });
  const flat = data[0] as unknown as ArrayLike<number>;
  const values: Array<number | null> = Array.from(flat, (v) => (Number.isFinite(v) ? v : null));
  return {
    values,
    width: col1 - col0,
    height: row1 - row0,
    originX: bbox[0] + col0 * res,
    originY: bbox[3] - row0 * res,
    resolutionMeters: res,
    epsg,
  };
}

/** Una lectura por banda para toda la caja (cupo compartido + reintentos). */
export async function readBandBboxGrid(
  assetHref: string,
  min: { latitude: number; longitude: number },
  max: { latitude: number; longitude: number }
): Promise<BandBboxGrid | null> {
  try {
    return await withRetry(
      async () => {
        const signedHref = await signAssetHref(assetHref);
        return withPlanetarySlot(() => attemptReadBandBboxGrid(signedHref, min, max));
      },
      { maxRetries: MAX_READ_RETRIES }
    );
  } catch {
    return null;
  }
}
