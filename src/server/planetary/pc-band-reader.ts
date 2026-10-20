/**
 * Lectura de un valor de banda real desde un COG (Cloud-Optimized GeoTIFF) de Sentinel-2 L2A,
 * vía HTTP range requests — sin descargar la imagen completa. Reproyecta WGS84 → la CRS
 * proyectada del raster (normalmente UTM) con proj4, según el EPSG reportado por el propio
 * COG (nunca asumido/hardcodeado a una zona fija).
 */

import proj4 from "proj4";
import { fromUrl, type GeoTIFFImage } from "geotiff";
import { signAssetHref } from "./pc-sign.client";

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
  assetHref: string,
  latitude: number,
  longitude: number
): Promise<BandPixelReadResult | null> {
  const signedHref = await signAssetHref(assetHref);
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
  assetHref: string,
  latitude: number,
  longitude: number,
  windowSize: number
): Promise<BandWindowReadResult | null> {
  const signedHref = await signAssetHref(assetHref);
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
  for (let attempt = 1; attempt <= MAX_READ_ATTEMPTS; attempt++) {
    try {
      return await attemptReadBandWindowAtPoint(assetHref, latitude, longitude, windowSize);
    } catch {
      if (attempt === MAX_READ_ATTEMPTS) return null;
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }
  return null;
}

// Deliberadamente bajo: cada intento ya implica una petición HTTP real (firma + range request
// al COG en Azure Blob Storage) que puede tardar varios segundos por sí sola. Un tercer intento
// multiplicaría la latencia total sin una ganancia de fiabilidad proporcional — 2 intentos
// cubre el caso típico de un fallo puntual sin volver la consulta impracticablemente lenta.
const MAX_READ_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  for (let attempt = 1; attempt <= MAX_READ_ATTEMPTS; attempt++) {
    try {
      return await attemptReadBandPixelAtPoint(assetHref, latitude, longitude);
    } catch {
      if (attempt === MAX_READ_ATTEMPTS) return null;
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }
  return null;
}
