/**
 * Polígono del cauce subido por el usuario (almacén en archivos) con caché en memoria.
 * Al cambiarlo se vacía la caché de reflectancias de Planetary: las selecciones guardadas
 * dependían del criterio de cauce anterior.
 */

import { createHash } from "node:crypto";
import { readJson, removeData, writeJson } from "@/server/storage/file-store";
import { clearPlanetaryReflectanceCache } from "@/server/planetary/pc-reflectance-cache";
import { validateChannelPolygon, type ChannelPolygonGeometry } from "@/satellite/geo/channel-polygon";

const FILE = "cauce/polygon.json";

export interface StoredChannelPolygon extends ChannelPolygonGeometry {
  name: string;
  uploadedAt: string;
  uploadedBy: string | null;
  hash: string;
}

let cache: { value: StoredChannelPolygon | null } | null = null;

export async function getChannelPolygon(): Promise<StoredChannelPolygon | null> {
  if (!cache) cache = { value: await readJson<StoredChannelPolygon | null>(FILE, null) };
  return cache.value;
}

/** Valida y guarda. Lanza GeoJsonValidationError con el motivo. */
export async function saveChannelPolygon(text: string, name: string, uploadedBy: string | null): Promise<StoredChannelPolygon> {
  const geometry = validateChannelPolygon(text);
  const stored: StoredChannelPolygon = {
    ...geometry,
    name: name.slice(0, 120) || "cauce.geojson",
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    hash: createHash("sha256").update(JSON.stringify(geometry.polygons)).digest("hex").slice(0, 12),
  };
  await writeJson(FILE, stored);
  cache = { value: stored };
  clearPlanetaryReflectanceCache();
  return stored;
}

export async function deleteChannelPolygon(): Promise<void> {
  await removeData(FILE);
  cache = { value: null };
  clearPlanetaryReflectanceCache();
}

/** Solo para pruebas. */
export function resetChannelPolygonCacheForTests(): void {
  cache = null;
}
