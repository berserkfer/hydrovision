import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UTM_17S_EPSG, fromUtm, toUtm, type LatLon } from "@/satellite/geo/projection";
import type { SceneGrid } from "@/satellite/tramos/tramo-suitability";
import {
  getProposals,
  proposalKey,
  runTramoFinder,
  saveUploadedTrace,
  setProposal,
  tramoCandidatesToCsv,
  type TramoFinderDeps,
} from "./tramo-finder.service";
import {
  getChannelPolygon,
  resetChannelPolygonCacheForTests,
  saveChannelPolygon,
} from "../channel/channel-polygon.store";
import * as reflectanceCache from "@/server/planetary/pc-reflectance-cache";

const P3 = { latitude: -6.8739979666, longitude: -79.9257441957 };
const P4 = { latitude: -6.8759197636, longitude: -79.92769465 };
const P6 = { latitude: -6.8737503294, longitude: -79.9322968282 };

// Parche de agua de 60 × 60 m a 15 m al este del punto medio entre P3 y P4 (no es histórico).
const mid = toUtm({ latitude: (P3.latitude + P4.latitude) / 2, longitude: (P3.longitude + P4.longitude) / 2 });
const WATER_CENTER = { easting: mid.easting + 15, northing: mid.northing };

function inSquare(e: number, n: number, c: { easting: number; northing: number }, half: number) {
  return Math.abs(e - c.easting) <= half && Math.abs(n - c.northing) <= half;
}

/** Escena sintética: tierra salvo agua en el parche y alrededor de P6; nube opcional sobre el parche. */
function syntheticScene(id: string, min: LatLon, max: LatLon, cloudOverPatch: boolean): SceneGrid {
  const a = toUtm(min);
  const b = toUtm(max);
  const originX = Math.floor(Math.min(a.easting, b.easting) / 10) * 10;
  const originY = Math.ceil(Math.max(a.northing, b.northing) / 10) * 10;
  const width = Math.ceil((Math.max(a.easting, b.easting) - originX) / 10);
  const height = Math.ceil((originY - Math.min(a.northing, b.northing)) / 10);
  const p6 = toUtm(P6);
  const green: number[] = [];
  const nir: number[] = [];
  const scl: number[] = [];
  for (let r = 0; r < height; r += 1) {
    for (let c = 0; c < width; c += 1) {
      const e = originX + (c + 0.5) * 10;
      const n = originY - (r + 0.5) * 10;
      const water = inSquare(e, n, WATER_CENTER, 30) || inSquare(e, n, p6, 40);
      const cloud = cloudOverPatch && inSquare(e, n, WATER_CENTER, 40);
      green.push(cloud ? 0.4 : water ? 0.08 : 0.1);
      nir.push(cloud ? 0.42 : water ? 0.02 : 0.25);
      scl.push(cloud ? 9 : water ? 6 : 5);
    }
  }
  return {
    sceneId: id,
    acquisitionDate: `2026-10-0${id.slice(-1)}`,
    cloudPercentage: 10,
    epsg: UTM_17S_EPSG,
    pixelSizeM: 10,
    originX,
    originY,
    width,
    height,
    green,
    nir,
    scl,
  };
}

const deps: TramoFinderDeps = {
  findScenes: async () => [
    { id: "S1", date: "2026-10-01", cloud: 5 },
    { id: "S2", date: "2026-10-02", cloud: 8 },
    { id: "S3", date: "2026-10-03", cloud: 30 },
  ],
  readSceneGrid: async (id, min, max) => syntheticScene(id, min, max, id === "S3"),
};

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hv-tramos-"));
  vi.stubEnv("HV_DATA_DIR", dir);
  resetChannelPolygonCacheForTests();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetChannelPolygonCacheForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe("buscador de tramos aptos", () => {
  it("encuentra el tramo con agua, lo marca como nuevo y lo pone primero", async () => {
    const result = await runTramoFinder({}, deps);
    const top = result.candidates[0];

    expect(result.trace.source).toBe("default_points");
    expect(result.scenes.every((s) => s.status === "read")).toBe(true);
    expect(top.origin).toBe("nuevo");
    expect(top.historicalCode).toBeNull();
    // Apto en S1 y S2; en S3 la nube sobre el parche descarta la ventana.
    expect(top.scenesApt).toBe(2);
    expect(top.scenesDiscardedClouds).toBe(1);
    expect(top.aptitudeFrequency).toBeCloseTo(2 / 3, 3);
    expect(top.meanWaterFraction).toBeGreaterThanOrEqual(0.5);
    // Coordenadas representativas dentro del parche, en UTM 17S y geográficas.
    expect(Math.abs(top.utm17s.easting - WATER_CENTER.easting)).toBeLessThanOrEqual(35);
    expect(top.coordinate.latitude).toBeLessThan(0);
    expect(top.nearestHistorical.distanceM).toBeGreaterThan(25);

    // Los tramos sin agua quedan con aptitud 0 al final.
    const last = result.candidates[result.candidates.length - 1];
    expect(last.aptitudeFrequency).toBe(0);
  });

  it("evalúa P6–P10 aparte como referencia histórica", async () => {
    const result = await runTramoFinder({}, deps);
    expect(result.references.map((r) => r.id)).toEqual(["P6", "P7", "P8", "P9", "P10"]);
    const p6 = result.references.find((r) => r.id === "P6")!;
    expect(p6.role).toBe("referencia");
    expect(p6.origin).toBe("historico");
    expect(p6.aptitudeFrequency).toBe(1);
    expect(result.references.find((r) => r.id === "P7")!.aptitudeFrequency).toBe(0);
  });

  it("guarda marcas de propuesto por traza y las exporta en CSV", async () => {
    const result = await runTramoFinder({}, deps);
    const top = result.candidates[0];
    await setProposal(result.traceKey, top.id, true, "investigador@hydrovision.test");
    const proposals = await getProposals();
    expect(proposals[proposalKey(result.traceKey, top.id)].proposed).toBe(true);

    const csv = tramoCandidatesToCsv(result, proposals);
    const [header, first] = csv.split("\n");
    expect(header).toContain("este_utm17s");
    expect(header).toContain("origen");
    expect(first).toContain(top.id);
    expect(first.endsWith(",si")).toBe(true);
  });

  it("usa la traza subida (GeoJSON de línea) en vez de la por defecto", async () => {
    const a = toUtm(P3);
    const end = fromUtm({ easting: a.easting + 100, northing: a.northing });
    await saveUploadedTrace(
      JSON.stringify({ type: "LineString", coordinates: [[P3.longitude, P3.latitude], [end.longitude, end.latitude]] }),
      "eje.geojson",
      null
    );
    const result = await runTramoFinder({}, deps);
    expect(result.trace.source).toBe("uploaded_line");
    expect(result.trace.samples).toBe(3);
    expect(result.traceKey).not.toBe("default");
  });

  it("sin escenas legibles falla en vez de inventar resultados", async () => {
    await expect(
      runTramoFinder({}, { ...deps, readSceneGrid: async () => null })
    ).rejects.toThrow(/Ninguna escena/);
  });

  it("con polígono del cauce, el agua fuera del polígono no hace apto al tramo (Fase 3)", async () => {
    // Polígono de 40 m de ancho centrado en la traza, desplazado 200 m al oeste del parche de agua.
    const corner = (de: number, dn: number) => {
      const p = fromUtm({ easting: WATER_CENTER.easting + de, northing: WATER_CENTER.northing + dn });
      return [p.longitude, p.latitude];
    };
    const clear = vi.spyOn(reflectanceCache, "clearPlanetaryReflectanceCache");
    await saveChannelPolygon(
      JSON.stringify({
        type: "Polygon",
        coordinates: [[corner(-260, -40), corner(-220, -40), corner(-220, 40), corner(-260, 40), corner(-260, -40)]],
      }),
      "cauce-prueba.geojson",
      "admin@hydrovision.test"
    );
    expect(clear).toHaveBeenCalled();
    expect((await getChannelPolygon())?.name).toBe("cauce-prueba.geojson");

    const result = await runTramoFinder({}, deps);
    expect(result.candidates.every((c) => c.scenesApt === 0)).toBe(true);
    expect(result.notes.some((n) => n.includes("cauce-prueba.geojson"))).toBe(true);
  });
});
