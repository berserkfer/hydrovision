/**
 * Mezcla subpíxel en el adaptador: desactivada por defecto, experimental y fuera de las métricas.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CrsPoint } from "./pc-band-reader";

vi.mock("./pc-band-reader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./pc-band-reader")>();
  return { ...actual, readBandGridAtPoint: vi.fn(), readBandAtCrsPoints: vi.fn(), readBandPixelAtPoint: vi.fn() };
});

vi.mock("./pc-stac.client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./pc-stac.client")>();
  return {
    ...actual,
    getSentinel2ItemById: vi.fn(async (id: string) => ({
      id,
      properties: { datetime: "2026-10-09T15:40:00Z", "eo:cloud_cover": 5, "s2:processing_baseline": "05.11" },
      assets: Object.fromEntries(["B03", "B04", "B05", "B08", "B11", "SCL"].map((b) => [b, { href: `https://blob/${id}/${b}.tif` }])),
    })),
  };
});

import { readBandAtCrsPoints, readBandGridAtPoint, readBandPixelAtPoint, wgs84ToCrs } from "./pc-band-reader";
import { clearPlanetaryReflectanceCache, planetaryAdapter } from "./planetary.adapter";

const POINT = { latitude: -6.8739979666, longitude: -79.9257441957 }; // P3
// Reflectancias de los endmembers; DN = refl·10000 + 1000 (offset BOA ≥ 04.00).
const WATER = { B03: 0.06, B04: 0.04, B08: 0.02, scl: 6 };
const SOIL = { B03: 0.12, B04: 0.15, B08: 0.22, scl: 5 };
const VEG = { B03: 0.05, B04: 0.04, B08: 0.35, scl: 4 };
const dn = (r: number) => r * 10000 + 1000;

/** Píxel (r, c) relativo al centro: laguna al oeste, vegetación al este, suelo al centro. */
function classAt(dRow: number, dCol: number) {
  if (dRow === 0 && dCol === 0) return { B03: 0.4 * WATER.B03 + 0.6 * SOIL.B03, B04: 0.4 * WATER.B04 + 0.6 * SOIL.B04, B08: 0.4 * WATER.B08 + 0.6 * SOIL.B08, scl: 5 };
  if (dCol <= -8) return WATER;
  if (dCol >= 8) return VEG;
  return SOIL;
}

function mockScene() {
  vi.mocked(readBandGridAtPoint).mockImplementation(async (href: string, lat: number, lon: number, half: number) => {
    const center = wgs84ToCrs(32717, lat, lon);
    const size = 2 * half + 1;
    const band = href.match(/(B0\d)\.tif$/)![1] as "B03" | "B04" | "B08";
    const values: number[][] = [];
    const cellCenters: CrsPoint[][] = [];
    for (let r = 0; r < size; r += 1) {
      const row: number[] = [];
      const centers: CrsPoint[] = [];
      for (let c = 0; c < size; c += 1) {
        row.push(dn(classAt(r - half, c - half)[band]));
        centers.push({ x: center.x + (c - half) * 10, y: center.y - (r - half) * 10 });
      }
      values.push(row);
      cellCenters.push(centers);
    }
    return { values, cellCenters, epsg: 32717, resolutionMeters: 10 };
  });
  vi.mocked(readBandAtCrsPoints).mockImplementation(async (_href: string, points: CrsPoint[]) => {
    const center = wgs84ToCrs(32717, POINT.latitude, POINT.longitude);
    return points.map((p) => classAt(Math.round((center.y - p.y) / 10), Math.round((p.x - center.x) / 10)).scl);
  });
  vi.mocked(readBandPixelAtPoint).mockResolvedValue({ rawValue: 1500, epsg: 32717, resolutionMeters: 20 });
}

const read = () =>
  planetaryAdapter.getReflectanceAtPoint({ ...POINT, startDate: "2026-10-01", endDate: "2026-10-15", sceneId: "S2A_SUB" });

beforeEach(() => {
  clearPlanetaryReflectanceCache();
  mockScene();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("mezcla subpíxel en el adaptador", () => {
  it("desactivada por defecto: no lee B04 ni agrega la estimación", async () => {
    const record = await read();
    expect(record?.subpixelEstimate).toBeUndefined();
    const bands = vi.mocked(readBandGridAtPoint).mock.calls.map(([href]) => String(href).slice(-7));
    expect(bands.sort()).toEqual(["B03.tif", "B08.tif"]);
  });

  it("activada: estima f_agua del píxel mixto con endmembers de la escena, marcada experimental", async () => {
    vi.stubEnv("SUBPIXEL_UNMIXING_ENABLED", "true");
    const record = await read();
    const est = record?.subpixelEstimate;
    expect(est?.experimental).toBe(true);
    expect(est?.status).toBe("ok");
    expect(est?.fractions?.agua).toBeCloseTo(0.4, 1);
    expect(est?.correctedWaterReflectance?.B03).toBeCloseTo(WATER.B03, 2);
    expect(est?.endmembers.agua?.pixels).toBeGreaterThanOrEqual(5);
    // La selección del píxel sigue usando la rejilla central (9×9), no la de endmembers.
    expect(record?.waterPixelSelection?.window.validPixels).toBeLessThanOrEqual(9);
  });
});

describe("fuera de las métricas de validación", () => {
  function sources(root: string): string[] {
    return readdirSync(root).flatMap((name) => {
      const full = join(root, name);
      if (statSync(full).isDirectory()) return sources(full);
      return name.endsWith(".ts") && !name.endsWith(".test.ts") ? [full] : [];
    });
  }

  it("ningún módulo de calibración, pares, validación o predicción usa la mezcla subpíxel", () => {
    const roots = [
      "src/satellite/calibration",
      "src/server/satellite/calibration",
      "src/server/satellite/validation",
      "src/server/satellite/prediction",
    ].map((r) => join(process.cwd(), r));
    const offenders = roots.flatMap(sources).filter((f) => /subpixel/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
