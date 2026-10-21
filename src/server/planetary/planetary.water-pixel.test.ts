/**
 * Integración del adaptador Planetary con la selección del píxel de agua, con bandas simuladas
 * (sin red): rejillas B03/B08, SCL en el centro de cada píxel y bandas puntuales.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CrsPoint } from "./pc-band-reader";

vi.mock("./pc-band-reader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./pc-band-reader")>();
  return {
    ...actual,
    readBandGridAtPoint: vi.fn(),
    readBandAtCrsPoints: vi.fn(),
    readBandPixelAtPoint: vi.fn(),
  };
});

vi.mock("./pc-stac.client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./pc-stac.client")>();
  return {
    ...actual,
    getSentinel2ItemById: vi.fn(async (id: string) => ({
      id,
      properties: { datetime: "2026-10-09T15:40:00Z", "eo:cloud_cover": 12, "s2:processing_baseline": "05.11" },
      assets: Object.fromEntries(
        ["B03", "B04", "B05", "B08", "B11", "SCL"].map((b) => [b, { href: `https://blob/${id}/${b}.tif` }])
      ),
    })),
  };
});

import { readBandAtCrsPoints, readBandGridAtPoint, readBandPixelAtPoint, wgs84ToCrs } from "./pc-band-reader";
import { clearPlanetaryReflectanceCache, planetaryAdapter } from "./planetary.adapter";

const EPSG = 32717;
const POINT = { latitude: -6.8764093577, longitude: -79.9282274949 }; // P5
const SIZE = 9; // radio 30 m + ventana 3×3
const HALF = 4;
// DN con offset BOA 1000 (baseline ≥ 04.00): reflectancia = (DN − 1000) / 10000
const DN = { waterGreen: 1800, waterNir: 1200, soilGreen: 2000, soilNir: 3500 };

type Cell = "water" | "soil" | "cloud";

function layout(fill: Cell, cells: Array<[number, number, Cell]> = []): Cell[][] {
  const g = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => fill));
  for (const [r, c, v] of cells) g[r][c] = v;
  return g;
}

function columns(cols: number[], value: Cell): Array<[number, number, Cell]> {
  const out: Array<[number, number, Cell]> = [];
  for (let r = 0; r < SIZE; r += 1) for (const c of cols) out.push([r, c, value]);
  return out;
}

function mockScene(cells: Cell[][]) {
  const center = wgs84ToCrs(EPSG, POINT.latitude, POINT.longitude);
  const cellCenters: CrsPoint[][] = cells.map((row, r) =>
    row.map((_, c) => ({ x: center.x + (c - HALF) * 10, y: center.y - (r - HALF) * 10 }))
  );
  const grid = (pick: (cell: Cell) => number) => ({
    values: cells.map((row) => row.map(pick)),
    cellCenters,
    epsg: EPSG,
    resolutionMeters: 10,
  });
  vi.mocked(readBandGridAtPoint).mockImplementation(async (href: string) =>
    href.endsWith("B03.tif")
      ? grid((c) => (c === "water" ? DN.waterGreen : c === "soil" ? DN.soilGreen : 5000))
      : grid((c) => (c === "water" ? DN.waterNir : c === "soil" ? DN.soilNir : 5200))
  );
  vi.mocked(readBandAtCrsPoints).mockImplementation(async () =>
    cells.flat().map((c) => (c === "water" ? 6 : c === "soil" ? 5 : 9))
  );
  vi.mocked(readBandPixelAtPoint).mockImplementation(async () => ({ rawValue: 1500, epsg: EPSG, resolutionMeters: 20 }));
}

async function read() {
  return planetaryAdapter.getReflectanceAtPoint({
    ...POINT,
    startDate: "2026-10-01",
    endDate: "2026-10-15",
    sceneId: "S2A_TEST",
  });
}

beforeEach(() => clearPlanetaryReflectanceCache());
afterEach(() => vi.clearAllMocks());

describe("planetary.adapter — selección del píxel de agua", () => {
  it("píxel central de suelo con agua adyacente: se ajusta y muestrea las bandas en el píxel de agua", async () => {
    mockScene(layout("soil", columns([5, 6], "water")));
    const record = await read();
    const sel = record?.waterPixelSelection;

    expect(sel?.status).toBe("adjusted");
    expect(sel?.adjustmentDistanceM).toBe(10);
    expect(sel?.originalCoordinate).toEqual(POINT);
    expect(sel?.adjustedCoordinate).not.toBeNull();
    // 10 m al este → longitud mayor, latitud casi igual.
    expect(sel!.adjustedCoordinate!.longitude).toBeGreaterThan(POINT.longitude);
    expect(Math.abs(sel!.adjustedCoordinate!.latitude - POINT.latitude)).toBeLessThan(0.00005);

    // B04/B05/B11 se leen en la coordenada ajustada, no en la original.
    const calls = vi.mocked(readBandPixelAtPoint).mock.calls;
    expect(calls).toHaveLength(3);
    for (const [, lat, lon] of calls) {
      expect(lat).toBeCloseTo(sel!.adjustedCoordinate!.latitude, 7);
      expect(lon).toBeCloseTo(sel!.adjustedCoordinate!.longitude, 7);
    }

    // Reflectancias B03/B08 del píxel de agua elegido y SCL = agua.
    expect(record?.reflectances.B03).toBeCloseTo(0.08, 4);
    expect(record?.reflectances.B08).toBeCloseTo(0.02, 4);
    expect(record?.sclRawValue).toBe(6);
    expect(record?.waterSufficiency).toBe("sufficient");
  });

  it("sin agua en el radio: bloqueado (la predicción no se emite)", async () => {
    mockScene(layout("soil", columns([8], "water")));
    const record = await read();
    expect(record?.waterPixelSelection?.status).toBe("blocked_no_water_in_radius");
    expect(record?.waterPixelSelection?.adjustedCoordinate).toBeNull();
    expect(record?.waterSufficiency).toBe("insufficient");
  });

  it("ventana con nubes: escena descartada para el punto", async () => {
    mockScene(layout("water", [[4, 5, "cloud"]]));
    const record = await read();
    expect(record?.waterPixelSelection?.status).toBe("discarded_clouds");
    expect(record?.waterSufficiency).toBe("insufficient");
  });

  it("sin banda SCL no se elige píxel (no_data), nunca se asume agua", async () => {
    mockScene(layout("water"));
    vi.mocked(readBandAtCrsPoints).mockResolvedValue(null);
    const record = await read();
    expect(record?.waterPixelSelection?.status).toBe("no_data");
    expect(record?.waterSufficiency).toBe("unknown");
  });
});
