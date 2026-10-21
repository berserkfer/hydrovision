import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeArrayBuffer } from "geotiff";
import sharp from "sharp";
import { toUtm } from "@/satellite/geo/projection";
import { OWN_IMAGE_SOURCE } from "@/own-imagery/own-imagery.types";
import { OwnImageError, bandStats, parseExifGps, processGeoTiff, processPhoto } from "./own-imagery.processing";
import {
  createOwnImage,
  deleteOwnImage,
  detectOwnImageKind,
  listOwnImages,
  ownImageColumn,
  ownImagesNear,
  ownImagesToCsv,
} from "./own-imagery.service";

const P3 = { latitude: -6.8739979666, longitude: -79.9257441957 };

/**
 * GeoTIFF RGB de 40 × 20 m (1 m/píxel) en UTM 17S, con P3 en el centro.
 * Mitad oeste: B = 30 (agua oscura); mitad este: B = 90.
 */
async function rgbGeoTiff(epsgKey: Record<string, number> = { ProjectedCSTypeGeoKey: 32717 }) {
  const p = toUtm(P3);
  const w = 40;
  const h = 20;
  const values = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i += 1) {
    values[i * 3] = 10;
    values[i * 3 + 1] = 20;
    values[i * 3 + 2] = i % w < 20 ? 30 : 90;
  }
  const geographic = "GeographicTypeGeoKey" in epsgKey;
  return writeArrayBuffer(values, {
    width: w,
    height: h,
    SamplesPerPixel: 3,
    BitsPerSample: [8, 8, 8],
    PhotometricInterpretation: 2,
    ModelPixelScale: geographic ? [1 / 111_320, 1 / 111_320, 0] : [1, 1, 0],
    ModelTiepoint: geographic
      ? [0, 0, 0, P3.longitude - 20 / 111_320, P3.latitude + 10 / 111_320, 0]
      : [0, 0, 0, p.easting - 20, p.northing + 10, 0],
    GTModelTypeGeoKey: geographic ? 2 : 1,
    GTRasterTypeGeoKey: 1,
    ...epsgKey,
  });
}

/** Bloque EXIF mínimo (little endian) con GPS y DateTimeOriginal. */
function exifBlock(lat: number, lon: number, date: string): Uint8Array {
  const buf = new ArrayBuffer(400);
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  v.setUint16(0, 0x4949);
  v.setUint16(2, 42, true);
  v.setUint32(4, 8, true);
  const entry = (at: number, tag: number, type: number, count: number, value: number) => {
    v.setUint16(at, tag, true);
    v.setUint16(at + 2, type, true);
    v.setUint32(at + 4, count, true);
    v.setUint32(at + 8, value, true);
  };
  // IFD0 (offset 8): puntero GPS (0x8825) y Exif (0x8769)
  v.setUint16(8, 2, true);
  entry(10, 0x8769, 4, 1, 100);
  entry(22, 0x8825, 4, 1, 160);
  // Exif IFD (100): DateTimeOriginal ASCII de 20 bytes en 300
  v.setUint16(100, 1, true);
  entry(102, 0x9003, 2, 20, 300);
  for (let i = 0; i < date.length; i += 1) bytes[300 + i] = date.charCodeAt(i);
  // GPS IFD (160)
  const dms = (deg: number) => {
    const a = Math.abs(deg);
    const d = Math.floor(a);
    const m = Math.floor((a - d) * 60);
    const s = Math.round(((a - d) * 60 - m) * 60 * 10000);
    return [d, 1, m, 1, s, 10000];
  };
  v.setUint16(160, 4, true);
  entry(162, 1, 2, 2, lat < 0 ? 0x53 : 0x4e); // "S" / "N"
  entry(174, 2, 5, 3, 220);
  entry(186, 3, 2, 2, lon < 0 ? 0x57 : 0x45); // "W" / "E"
  entry(198, 4, 5, 3, 250);
  dms(lat).forEach((n, i) => v.setUint32(220 + i * 4, n, true));
  dms(lon).forEach((n, i) => v.setUint32(250 + i * 4, n, true));
  return bytes;
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hv-own-"));
  vi.stubEnv("HV_DATA_DIR", dir);
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

describe("estadísticas por banda", () => {
  it("ignora nodata y no finitos", () => {
    const s = bandStats("b", [10, 20, 0, Number.NaN, 30], 0);
    expect(s).toMatchObject({ mean: 20, min: 10, max: 30, validPixels: 3 });
    expect(bandStats("b", []).mean).toBeNull();
  });
});

describe("GeoTIFF: recorte a la ventana del punto", () => {
  it("promedia solo la ventana geográfica alrededor del punto", async () => {
    // Ventana de 10 m centrada en P3 (frontera entre mitades): mitad 30, mitad 90 → B ≈ 60.
    const r = await processGeoTiff(await rgbGeoTiff(), P3, 10);
    expect(r.crop).toMatchObject({ method: "ventana_geografica", windowM: 10, widthPx: 10, heightPx: 10 });
    expect(r.georef).toMatchObject({ method: "geotiff", crs: "EPSG:32717", resolutionM: 1 });
    expect(r.bands.map((b) => b.name)).toEqual(["banda_1", "banda_2", "banda_3"]);
    expect(r.bands[0].mean).toBe(10);
    expect(r.bands[2].mean).toBeCloseTo(60, 0);
    expect(r.bands[2].validPixels).toBe(100);
  });

  it("acepta GeoTIFF en geográficas (EPSG:4326)", async () => {
    const r = await processGeoTiff(await rgbGeoTiff({ GeographicTypeGeoKey: 4326 }), P3, 10);
    expect(r.georef.crs).toBe("EPSG:4326");
    expect(r.bands[2].mean).toBeCloseTo(60, -1);
  });

  it("rechaza otro sistema de coordenadas y puntos fuera de la imagen", async () => {
    await expect(processGeoTiff(await rgbGeoTiff({ ProjectedCSTypeGeoKey: 3857 }), P3, 10)).rejects.toThrow(/sistema admitido/);
    const far = { latitude: P3.latitude - 0.01, longitude: P3.longitude };
    await expect(processGeoTiff(await rgbGeoTiff(), far, 10)).rejects.toBeInstanceOf(OwnImageError);
  });
});

describe("fotos georreferenciadas", () => {
  it("lee GPS y fecha del EXIF", () => {
    const gps = parseExifGps(exifBlock(-6.874, -79.9257, "2026:10:20 09:15:00"));
    expect(gps?.latitude).toBeCloseTo(-6.874, 5);
    expect(gps?.longitude).toBeCloseTo(-79.9257, 5);
    expect(gps?.capturedAt).toBe("2026-10-20T09:15:00");
    expect(parseExifGps(new Uint8Array(4))).toBeNull();
  });

  it("recorta el centro de la foto y declara la posición de la cámara", async () => {
    // Foto 100×100: centro (40 %) verde, bordes rojos.
    const raw = Buffer.alloc(100 * 100 * 3);
    for (let y = 0; y < 100; y += 1) {
      for (let x = 0; x < 100; x += 1) {
        const center = x >= 30 && x < 70 && y >= 30 && y < 70;
        raw.set(center ? [0, 200, 0] : [200, 0, 0], (y * 100 + x) * 3);
      }
    }
    const png = await sharp(raw, { raw: { width: 100, height: 100, channels: 3 } }).png().toBuffer();
    const camera = { latitude: P3.latitude + 0.0001, longitude: P3.longitude };
    const r = await processPhoto(png, P3, camera);
    expect(r.crop).toMatchObject({ method: "centro_imagen", widthPx: 40, heightPx: 40 });
    expect(r.bands.find((b) => b.name === "G")?.mean).toBe(200);
    expect(r.bands.find((b) => b.name === "R")?.mean).toBe(0);
    expect(r.georef.method).toBe("manual");
    expect(r.georef.distanceToTargetM).toBeGreaterThan(10);
    expect(r.georef.distanceToTargetM).toBeLessThan(12);
  });

  it("sin GPS en el EXIF ni posición manual, no se acepta", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#123456" } }).png().toBuffer();
    await expect(processPhoto(png, P3, null)).rejects.toThrow(/GPS/);
  });
});

describe("registro de imagen propia", () => {
  it("se guarda con fuente imagen_propia, se exporta aparte y se puede borrar", async () => {
    const tif = new Uint8Array(await rgbGeoTiff());
    expect(detectOwnImageKind(tif)).toBe("geotiff");
    expect(detectOwnImageKind(new Uint8Array([1, 2, 3, 4]))).toBeNull();

    const record = await createOwnImage({
      fileName: "dron-p3.tif",
      bytes: tif,
      target: { label: "P3", ...P3 },
      windowM: 10,
      uploadedBy: "tecnico@hydrovision.test",
    });
    expect(record.source).toBe(OWN_IMAGE_SOURCE);
    expect(await listOwnImages()).toHaveLength(1);

    const near = ownImagesNear(await listOwnImages(), P3);
    expect(ownImageColumn(near).count).toBe(1);
    expect(ownImageColumn([]).count).toBe(0);

    const csv = ownImagesToCsv(await listOwnImages());
    expect(csv.split("\n")[0].startsWith("fuente,")).toBe(true);
    expect(csv.split("\n")[1].startsWith("imagen_propia,")).toBe(true);

    expect(await deleteOwnImage(record.id)).toBe(true);
    expect(await listOwnImages()).toHaveLength(0);
  });

  it("rechaza formatos no admitidos", async () => {
    await expect(
      createOwnImage({ fileName: "x.txt", bytes: new TextEncoder().encode("hola mundo"), target: { label: "P3", ...P3 }, uploadedBy: null })
    ).rejects.toThrow(/Formato no admitido/);
  });
});

describe("separación de los datos satelitales", () => {
  /** Archivos .ts de un directorio (recursivo), sin pruebas. */
  function sources(root: string): string[] {
    return readdirSync(root).flatMap((name) => {
      const full = join(root, name);
      if (statSync(full).isDirectory()) return sources(full);
      return name.endsWith(".ts") && !name.endsWith(".test.ts") ? [full] : [];
    });
  }

  it("ningún módulo de calibración, pares o métricas importa las imágenes propias", () => {
    const roots = [
      "src/satellite/calibration",
      "src/satellite/quality",
      "src/server/satellite/calibration",
      "src/server/satellite/validation",
      "src/server/satellite/prediction",
    ].map((r) => join(process.cwd(), r));
    const offenders = roots.flatMap(sources).filter((file) => /own-imagery|imagen_propia/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
