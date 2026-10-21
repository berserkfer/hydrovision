/**
 * Almacén en archivos JSON para resultados calculados y configuraciones subidas por el usuario
 * (reportes en segundo plano, tramos propuestos, geometrías del cauce, imágenes propias).
 *
 * Mientras no haya PostgreSQL disponible, esto da persistencia simple entre reinicios.
 * Directorio: HV_DATA_DIR (por defecto `.hv-data/` en la raíz del proyecto, fuera de git).
 * Escritura atómica: archivo temporal + rename, para no dejar JSON a medio escribir.
 */

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export function getDataDir(): string {
  return resolve(process.env.HV_DATA_DIR?.trim() || join(process.cwd(), ".hv-data"));
}

/** Ruta segura dentro del directorio de datos (rechaza "..", rutas absolutas, etc.). */
export function dataPath(...parts: string[]): string {
  const base = getDataDir();
  const target = resolve(base, ...parts);
  const rel = relative(base, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("Ruta fuera del directorio de datos");
  }
  return target;
}

export async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(dataPath(relativePath), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(relativePath: string, value: unknown): Promise<void> {
  const target = dataPath(relativePath);
  await mkdir(dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await rename(tmp, target);
}

export async function writeBinary(relativePath: string, data: Uint8Array): Promise<string> {
  const target = dataPath(relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  return target;
}

export async function readBinary(relativePath: string): Promise<Buffer | null> {
  try {
    return await readFile(dataPath(relativePath));
  } catch {
    return null;
  }
}

export async function removeData(relativePath: string): Promise<void> {
  await rm(dataPath(relativePath), { force: true, recursive: true });
}
