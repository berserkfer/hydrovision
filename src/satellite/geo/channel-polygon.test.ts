import { describe, expect, it } from "vitest";
import { isInsideChannel, ringSelfIntersects, validateChannelPolygon } from "./channel-polygon";
import { fromUtm, toUtm, type LatLon } from "./projection";
import { selectWaterPixel, type GridPixel } from "../quality/water-pixel-selection";

const BASE = toUtm({ latitude: -6.8739979666, longitude: -79.9257441957 }); // P3

/** Anillo en metros relativos a P3 → posiciones [lon, lat] para GeoJSON. */
function ring(offsets: Array<[number, number]>): number[][] {
  return offsets.map(([de, dn]) => {
    const p = fromUtm({ easting: BASE.easting + de, northing: BASE.northing + dn });
    return [p.longitude, p.latitude];
  });
}

function polygonGeoJson(...rings: Array<Array<[number, number]>>) {
  return JSON.stringify({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: rings.map(ring) } });
}

const SQUARE: Array<[number, number]> = [[0, 0], [100, 0], [100, 50], [0, 50], [0, 0]];

describe("validación del polígono del cauce", () => {
  it("acepta un polígono válido y calcula su área", () => {
    const g = validateChannelPolygon(polygonGeoJson(SQUARE));
    expect(g.polygons).toHaveLength(1);
    expect(g.areaM2).toBeGreaterThan(4_900);
    expect(g.areaM2).toBeLessThan(5_100);
  });

  it("acepta un polígono con agujero interior", () => {
    const hole: Array<[number, number]> = [[40, 20], [60, 20], [60, 30], [40, 30], [40, 20]];
    const g = validateChannelPolygon(polygonGeoJson(SQUARE, hole));
    expect(g.areaM2).toBeGreaterThan(4_700);
    expect(g.areaM2).toBeLessThan(4_900);
  });

  it("rechaza autointersección (moño), área nula, agujero fuera y líneas", () => {
    const bowtie: Array<[number, number]> = [[0, 0], [100, 50], [100, 0], [0, 50], [0, 0]];
    expect(() => validateChannelPolygon(polygonGeoJson(bowtie))).toThrow(/se cruza/);
    const flat: Array<[number, number]> = [[0, 0], [50, 0], [100, 0], [0, 0]];
    expect(() => validateChannelPolygon(polygonGeoJson(flat))).toThrow(/área/);
    const outsideHole: Array<[number, number]> = [[200, 200], [220, 200], [220, 220], [200, 220], [200, 200]];
    expect(() => validateChannelPolygon(polygonGeoJson(SQUARE, outsideHole))).toThrow(/agujero/);
    const line = JSON.stringify({ type: "LineString", coordinates: ring([[0, 0], [100, 0]]) });
    expect(() => validateChannelPolygon(line)).toThrow(/Polygon/);
  });

  it("valida el sistema de coordenadas y el tamaño máximo", () => {
    const utm = JSON.stringify({
      type: "Polygon",
      crs: { type: "name", properties: { name: "EPSG:32717" } },
      coordinates: [SQUARE.map(([de, dn]) => [BASE.easting + de, BASE.northing + dn])],
    });
    expect(validateChannelPolygon(utm).sourceCrs).toBe("EPSG:32717");
    const mercator = JSON.stringify({
      type: "Polygon",
      crs: { type: "name", properties: { name: "EPSG:3857" } },
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    });
    expect(() => validateChannelPolygon(mercator)).toThrow(/no admitido/);
    expect(() => validateChannelPolygon(polygonGeoJson(SQUARE), { maxBytes: 50 })).toThrow(/máximo/);
  });

  it("detecta cruces de lados no consecutivos", () => {
    const toLatLon = (o: Array<[number, number]>): LatLon[] =>
      o.map(([de, dn]) => fromUtm({ easting: BASE.easting + de, northing: BASE.northing + dn }));
    expect(ringSelfIntersects(toLatLon(SQUARE))).toBe(false);
    expect(ringSelfIntersects(toLatLon([[0, 0], [100, 50], [100, 0], [0, 50], [0, 0]]))).toBe(true);
  });
});

describe("el polígono tiene prioridad en la selección del píxel", () => {
  const WATER: GridPixel = { green: 0.08, nir: 0.02, scl: 6 };
  const SOIL: GridPixel = { green: 0.1, nir: 0.25, scl: 5 };
  const grid = (waterCols: number[]) => ({
    pixelSizeM: 10,
    pixels: Array.from({ length: 9 }, () => Array.from({ length: 9 }, (_, c) => ({ ...(waterCols.includes(c) ? WATER : SOIL) }))),
  });

  it("un píxel central de agua fuera del polígono no se acepta: se busca agua dentro", () => {
    // Agua en las columnas 3–5 (incluye el centro) y 7–8; el polígono solo cubre las columnas ≥ 6.
    const result = selectWaterPixel(grid([3, 4, 5, 7, 8]), { searchRadiusM: 30, isInChannel: (_r, dCol) => dCol >= 2 });
    expect(result.status).toBe("adjusted");
    expect(result.pixelOffset?.dCol).toBe(3);
    expect(result.channelCheck).toBe("channel_polygon");
  });

  it("sin agua dentro del polígono, se bloquea aunque haya agua conexa fuera", () => {
    const result = selectWaterPixel(grid([2, 3, 4, 5]), { searchRadiusM: 30, isInChannel: () => false });
    expect(result.status).toBe("blocked_no_water_in_radius");
    expect(result.reason).toMatch(/fuera del polígono/);
  });

  it("isInsideChannel respeta los agujeros", () => {
    const g = validateChannelPolygon(polygonGeoJson(SQUARE, [[40, 20], [60, 20], [60, 30], [40, 30], [40, 20]]));
    const at = (de: number, dn: number) => fromUtm({ easting: BASE.easting + de, northing: BASE.northing + dn });
    expect(isInsideChannel(at(10, 10), g.polygons)).toBe(true);
    expect(isInsideChannel(at(50, 25), g.polygons)).toBe(false); // agujero
    expect(isInsideChannel(at(150, 25), g.polygons)).toBe(false);
  });
});
