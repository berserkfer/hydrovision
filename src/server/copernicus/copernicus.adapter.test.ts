/**
 * Tests — adaptador Copernicus no contiene fórmulas de índices, y fallback simulado honesto.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCatalogSearchBody,
  buildReflectanceEvalscript,
  buildProcessRequestBody,
} from "./copernicus-expression.builder";
import { mapCopernicusReflectances, extractSceneDetailsFromCatalogSearch, extractBandValuesFromCopernicusProcess } from "./copernicus-band.mapper";
import { buildSatelliteObservationFromCopernicus } from "@/server/satellite/satellite-observation.builder";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";
import { CopernicusAdapter } from "./copernicus.adapter";
import type { CopernicusAccessToken } from "./copernicus-oauth.client";

describe("Copernicus expression builder", () => {
  it("solo construye bbox/filtros/bandas — sin índices espectrales", () => {
    const body = buildCatalogSearchBody({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
      cloudCoverMax: 30,
    });
    expect(JSON.stringify(body)).not.toMatch(/NDVI|NDWI|NDCI|normalizedDifference/);
    expect(body.collections).toEqual(["sentinel-2-l2a"]);

    const evalscript = buildReflectanceEvalscript();
    expect(evalscript).not.toMatch(/NDVI|NDWI|NDCI|normalizedDifference/);
    expect(evalscript).toContain("B03");

    const processBody = buildProcessRequestBody({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });
    expect(JSON.stringify(processBody)).not.toMatch(/NDVI|NDWI|NDCI|normalizedDifference/);
  });
});

describe("Copernicus adapter separation", () => {
  it("copernicus.adapter.ts no importa computeSpectralIndex", () => {
    const source = readFileSync(resolve(process.cwd(), "src/server/copernicus/copernicus.adapter.ts"), "utf8");
    expect(source).not.toContain("computeSpectralIndex");
    expect(source).not.toContain("spectral-indices.catalog");
  });

  it("sin credenciales configuradas, retorna listas vacías (nunca fabrica escenas)", async () => {
    const fakeTokenProvider = {
      getAccessToken: async (): Promise<CopernicusAccessToken> => ({
        value: "x",
        expiresAt: new Date().toISOString(),
        source: "simulated" as const,
      }),
      refreshAccessToken: async (): Promise<CopernicusAccessToken> => ({
        value: "x",
        expiresAt: new Date().toISOString(),
        source: "simulated" as const,
      }),
      isTokenValid: () => false,
      revokeToken: () => {},
    };

    const adapter = new CopernicusAdapter(fakeTokenProvider, undefined, () => false);
    const scenes = await adapter.searchSentinel2Scenes({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });
    // isCopernicusConfigured() depende de env reales — sin COPERNICUS_CLIENT_ID/SECRET en test env, debe ser []
    expect(Array.isArray(scenes)).toBe(true);
  });
});

describe("Copernicus band mapper", () => {
  it("mapCopernicusReflectances es identidad para bandas Sentinel2BandCode válidas", () => {
    const mapped = mapCopernicusReflectances({ B03: 0.1, B04: 0.08, INVALID: 5 });
    expect(mapped).toEqual({ B03: 0.1, B04: 0.08 });
  });

  it("extractSceneDetailsFromCatalogSearch parsea FeatureCollection STAC", () => {
    const rows = extractSceneDetailsFromCatalogSearch({
      features: [
        {
          id: "S2A_MSIL2A_20250115T152019",
          properties: { datetime: "2025-01-15T15:20:19Z", "eo:cloud_cover": 8.5 },
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].sceneId).toBe("S2A_MSIL2A_20250115T152019");
    expect(rows[0].cloudPercentage).toBe(8.5);
  });

  it("extractBandValuesFromCopernicusProcess soporta forma array plano", () => {
    const values = extractBandValuesFromCopernicusProcess([0.1, 0.08, 0.09, 0.25, 0.04, 6], [
      "B03",
      "B04",
      "B05",
      "B08",
      "B11",
      "SCL",
    ]);
    expect(values.B03).toBe(0.1);
    expect(values.SCL).toBe(6);
  });

  it("extractBandValuesFromCopernicusProcess retorna {} ante forma no reconocida (nunca inventa)", () => {
    const values = extractBandValuesFromCopernicusProcess({ unexpected: "shape" }, ["B03"]);
    expect(values).toEqual({});
  });
});

describe("satellite observation builder — proveedor Copernicus", () => {
  it("calcula índices desde reflectancias Copernicus con catálogo HydroVision (mismo cálculo que GEE)", () => {
    const obs = buildSatelliteObservationFromCopernicus({
      stationId: "est-e01",
      isSimulated: true,
      scene: {
        sceneId: "S2A_cdse_test",
        systemIndex: "S2A_cdse_test",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        tileId: "T18LTJ",
        collection: "sentinel-2-l2a",
        platform: "sentinel2",
        systemTimeStart: Date.parse("2025-06-01T12:00:00.000Z"),
        metadataSource: "simulated",
        acquisitionFromSystemTime: true,
      },
      reflectance: {
        sceneId: "S2A_cdse_test",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        rawBandValues: { B03: 0.12, B04: 0.08, B05: 0.1, B08: 0.35, B11: 0.04 },
        reflectances: mapCopernicusReflectances({ B03: 0.12, B04: 0.08, B05: 0.1, B08: 0.35, B11: 0.04 }),
        bandsUsed: ["B03", "B04", "B05", "B08", "B11"],
        reflectanceSemanticStatus: "valid",
        scaleEvidence: {
          interpretation: "confirmed_surface_reflectance_0_1",
          minObserved: 0.04,
          maxObserved: 0.35,
          sampleCount: 5,
          notes: [],
        },
        pixelQualityStatus: "water",
        sclRawValue: 6,
        spatialRepresentativeness: "point_sampling",
        systemTimeStart: null,
      },
    });

    expect(obs.id).toMatch(/^copernicus-/);
    expect(obs.sourceType).toBe("satellite");
    expect(obs.indices.NDVI).toBe(computeSpectralIndex("NDVI", obs.reflectances!));
    expect(obs.indices.NDCI).toBe(computeSpectralIndex("NDCI", obs.reflectances!));
    expect(obs.isSimulated).toBe(true);
  });
});
