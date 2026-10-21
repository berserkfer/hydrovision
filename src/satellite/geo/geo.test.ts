import { describe, expect, it } from "vitest";
import { GeoJsonValidationError, parseGeoJson, pointInPolygon } from "./geojson";
import { defaultTrace, sampleLine, samplePolygon, sampleTrace, traceLengthM } from "./trace";
import { distanceMeters, fromUtm, toUtm } from "./projection";

const P1 = { latitude: -6.8721281932, longitude: -79.9227981642 };
const P5 = { latitude: -6.8764093577, longitude: -79.9282274949 };

function lineGeoJson(coords: number[][], crs?: string) {
  return JSON.stringify({
    type: "Feature",
    ...(crs ? { crs: { type: "name", properties: { name: crs } } } : {}),
    geometry: { type: "LineString", coordinates: coords },
    properties: {},
  });
}

describe("proyección UTM 17S", () => {
  it("ida y vuelta WGS84 ↔ UTM conserva la posición (< 1 mm)", () => {
    const back = fromUtm(toUtm(P1));
    expect(distanceMeters(P1, back)).toBeLessThan(0.001);
    expect(toUtm(P1).northing).toBeGreaterThan(9_000_000); // hemisferio sur
  });
});

describe("GeoJSON", () => {
  it("acepta una línea WGS84 en la zona del dren", () => {
    const g = parseGeoJson(lineGeoJson([[P1.longitude, P1.latitude], [P5.longitude, P5.latitude]]));
    expect(g.lines).toHaveLength(1);
    expect(g.sourceCrs).toBe("EPSG:4326");
  });

  it("convierte una línea declarada en UTM 17S (EPSG:32717)", () => {
    const a = toUtm(P1);
    const b = toUtm(P5);
    const g = parseGeoJson(
      lineGeoJson([[a.easting, a.northing], [b.easting, b.northing]], "urn:ogc:def:crs:EPSG::32717")
    );
    expect(g.sourceCrs).toBe("EPSG:32717");
    expect(distanceMeters(g.lines[0][0], P1)).toBeLessThan(0.01);
  });

  it("rechaza otros sistemas de coordenadas, zonas lejanas, tamaño excesivo y JSON inválido", () => {
    expect(() => parseGeoJson(lineGeoJson([[0, 0], [1, 1]], "EPSG:3857"))).toThrow(/no admitido/);
    expect(() => parseGeoJson(lineGeoJson([[-77.03, -12.04], [-77.02, -12.05]]))).toThrow(/fuera de la zona/);
    expect(() => parseGeoJson(lineGeoJson([[500000, 9240000], [500100, 9240100]]))).toThrow(/UTM/);
    expect(() => parseGeoJson("x".repeat(2000), { maxBytes: 1000 })).toThrow(/máximo/);
    expect(() => parseGeoJson("{nope")).toThrow(GeoJsonValidationError);
    expect(() => parseGeoJson(JSON.stringify({ type: "Point", coordinates: [P1.longitude, P1.latitude] }))).toThrow(
      /no admitido/
    );
  });

  it("rechaza un polígono sin cerrar", () => {
    const open = JSON.stringify({
      type: "Polygon",
      coordinates: [[[P1.longitude, P1.latitude], [P5.longitude, P5.latitude], [P5.longitude, P1.latitude], [P1.longitude, P5.latitude]]],
    });
    expect(() => parseGeoJson(open)).toThrow(/cerrado/);
  });
});

describe("traza y muestreo", () => {
  it("la traza por defecto une P1 → P5 y se muestrea cada 50 m", () => {
    const trace = defaultTrace();
    const length = traceLengthM(trace);
    const samples = sampleTrace(trace, 50);
    expect(trace.source).toBe("default_points");
    expect(length).toBeGreaterThan(500);
    expect(samples.length).toBe(Math.floor(length / 50) + 1 + (length % 50 > 25 ? 1 : 0));
    expect(distanceMeters(samples[0].coordinate, P1)).toBeLessThan(0.01);
    // Pasos consecutivos a 50 m (salvo en los vértices, donde la recta se dobla).
    const step = distanceMeters(samples[1].coordinate, samples[2].coordinate);
    expect(step).toBeLessThanOrEqual(50.01);
  });

  it("agrega el extremo solo si queda a más de media separación del último punto", () => {
    const a = toUtm(P1);
    const at = (m: number) => fromUtm({ easting: a.easting + m, northing: a.northing });
    // 120 m: el extremo queda a 20 m del punto de 100 m (dentro del radio de búsqueda de 30 m).
    expect(sampleLine([P1, at(120)], 50).map((s) => s.chainageM)).toEqual([0, 50, 100]);
    // 140 m: queda a 40 m, se agrega.
    expect(sampleLine([P1, at(140)], 50).map((s) => s.chainageM)).toEqual([0, 50, 100, 140]);
  });

  it("un polígono se muestrea con una rejilla de puntos interiores", () => {
    const a = toUtm(P1);
    const ring = [
      [0, 0],
      [200, 0],
      [200, 100],
      [0, 100],
      [0, 0],
    ].map(([de, dn]) => fromUtm({ easting: a.easting + de, northing: a.northing + dn }));
    const samples = samplePolygon([ring], 50);
    expect(samples).toHaveLength(8); // 4 columnas × 2 filas
    expect(samples.every((s) => pointInPolygon(s.coordinate, [ring]))).toBe(true);
  });
});
