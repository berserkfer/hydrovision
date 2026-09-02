/**
 * Tests — adaptador GEE no contiene fórmulas de índices
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSentinel2ReflectanceExpression, buildSentinel2SceneSearchExpression } from "@/server/gee/gee-expression.builder";
import { mapGeeReflectances } from "@/server/gee/gee-band.mapper";
import { buildSatelliteObservationFromGee } from "@/server/satellite/satellite-observation.builder";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";

describe("GEE expression builder", () => {
  it("solo construye expresiones de colección/bandas — sin índices", () => {
    const expr = buildSentinel2ReflectanceExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });

    expect(expr).toContain("ImageCollection");
    expect(expr).toContain(".select(");
    expect(expr).not.toMatch(/normalizedDifference|NDVI|NDWI|NDCI/);
  });

  it("scene search no incluye fórmulas espectrales", () => {
    const expr = buildSentinel2SceneSearchExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });
    expect(expr).not.toMatch(/NDVI|NDWI|NDCI|normalizedDifference/);
  });

  it("reflectance con sceneId filtra system:index de la escena seleccionada", () => {
    const sceneId = "20250115T152019_T18LTJ_20250115T152019";
    const expr = buildSentinel2ReflectanceExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
      sceneId,
    });
    expect(expr).toContain(`'${sceneId}'`);
    expect(expr).toContain("system:index");
  });
});

describe("GEE adapter separation", () => {
  it("gee.adapter.ts no importa computeSpectralIndex", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/server/gee/gee.adapter.ts"),
      "utf8"
    );
    expect(source).not.toContain("computeSpectralIndex");
    expect(source).not.toContain("spectral-indices.catalog");
  });

  it("gee-expression.builder.ts no contiene fórmulas de índices", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/server/gee/gee-expression.builder.ts"),
      "utf8"
    );
    expect(source).not.toMatch(/NDVI|NDWI|NDCI|normalizedDifference/);
  });
});

describe("satellite observation builder", () => {
  it("calcula índices desde reflectancias con catálogo HydroVision", () => {
    const obs = buildSatelliteObservationFromGee({
      stationId: "est-e01",
      isSimulated: true,
      scene: {
        sceneId: "S2A_test",
        systemIndex: "S2A_test",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        tileId: "T18LTJ",
        collection: "COPERNICUS/S2_SR_HARMONIZED",
        platform: "sentinel2",
        systemTimeStart: Date.parse("2025-06-01T12:00:00.000Z"),
        metadataSource: "simulated",
        acquisitionFromSystemTime: true,
      },
      reflectance: {
        sceneId: "S2A_test",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        rawBandValues: { B3: 0.12, B4: 0.08, B5: 0.1, B8: 0.35, B11: 0.04 },
        reflectances: mapGeeReflectances({ B3: 0.12, B4: 0.08, B5: 0.1, B8: 0.35, B11: 0.04 }),
        bandsUsed: ["B03", "B04", "B05", "B08", "B11"],
        reflectanceSemanticStatus: "valid",
        scaleEvidence: {
          interpretation: "confirmed_surface_reflectance_0_1",
          minObserved: 0.06,
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

    expect(obs.sourceType).toBe("satellite");
    expect(obs.indices.NDVI).toBe(computeSpectralIndex("NDVI", obs.reflectances!));
    expect(obs.indices.NDCI).toBe(computeSpectralIndex("NDCI", obs.reflectances!));
    expect(obs.indices.NDMI).toBe(computeSpectralIndex("NDMI", obs.reflectances!));
    expect(obs.isSimulated).toBe(true);
  });
});

describe("google oauth client", () => {
  it("exchangeServiceAccountJwtForAccessToken rechaza JWT inválido", async () => {
    const { exchangeServiceAccountJwtForAccessToken } = await import(
      "@/server/gee/google-oauth.client"
    );
    await expect(
      exchangeServiceAccountJwtForAccessToken("invalid.jwt.token")
    ).rejects.toThrow();
  });
});
