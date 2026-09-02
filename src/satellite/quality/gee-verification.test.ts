/**
 * Tests — verificación empírica GEE y métricas de calidad (Prompts 11–12).
 * Deterministas — sin Math.random(), sin GEE live requerido.
 * Fixtures sintéticos claramente marcados — no simulan resultados GEE reales.
 */

import { describe, expect, it } from "vitest";
import {
  extractSceneDetailsFromComputeValue,
  interpretReflectanceScale,
  processGeeSurfaceReflectances,
  systemTimeStartToAcquisitionDate,
} from "@/server/gee/gee-band.mapper";
import { evaluateCalibrationReadiness } from "@/satellite/calibration/calibration-readiness";
import {
  buildSentinel2SceneDetailsExpression,
  buildSentinel2ReflectanceExpression,
} from "@/server/gee/gee-expression.builder";
import {
  interpretSclPixelQuality,
  isPixelContaminated,
} from "@/satellite/quality/pixel-quality";
import { evaluateScientificPairQuality } from "@/satellite/quality/scientific-pair-quality";
import { buildScientificDatasetQualityReport } from "@/satellite/quality/dataset-quality-metrics";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";
import { geeEmpiricalVerificationService } from "@/server/gee/gee-empirical-verification.service";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";

describe("cloud 0 ≠ unknown", () => {
  it("cloud 0 es valor válido distinto de null", () => {
    const withZero = evaluateScientificPairQuality({
      stationId: "est-e01",
      fieldSampleId: "m-1",
      parameterCode: "turbidity",
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: false,
      satelliteObservationId: "sat-1",
      satelliteIsSimulated: false,
      matchingStatus: "matched",
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 20,
      cloudPercentage: 0,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: 0.1, ndmi: null },
    });
    expect(withZero.qualityStatus).toBe("accepted");

    const withNull = evaluateScientificPairQuality({
      stationId: "est-e01",
      fieldSampleId: "m-1",
      parameterCode: "turbidity",
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: false,
      satelliteObservationId: "sat-1",
      satelliteIsSimulated: false,
      matchingStatus: "matched",
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 20,
      cloudPercentage: null,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: 0.1, ndmi: null },
    });
    expect(withNull.qualityStatus).toBe("insufficient_data");
  });
});

describe("reflectance semantics", () => {
  it("reflectance 0.5 → valid", () => {
    const r = processGeeSurfaceReflectances({ B4: 0.05, B8: 0.5 });
    expect(r.semanticStatus).toBe("valid");
    expect(r.scaleEvidence.interpretation).toBe("confirmed_surface_reflectance_0_1");
  });

  it("reflectance negativa → out_of_range", () => {
    const r = processGeeSurfaceReflectances({ B4: -0.01, B8: 0.2 });
    expect(r.semanticStatus).toBe("out_of_range");
  });

  it("reflectance >1 → out_of_range sin conversión", () => {
    const r = processGeeSurfaceReflectances({ B4: 500, B8: 1200 });
    expect(r.semanticStatus).toBe("out_of_range");
    const scale = interpretReflectanceScale({ B4: 500, B8: 1200 });
    expect(scale.interpretation).toBe("likely_dn_or_scaled");
    expect(scale.notes.join(" ")).toMatch(/NO se aplica conversión/i);
  });

  it("índice no se calcula con reflectancia inválida", () => {
    const invalid = processGeeSurfaceReflectances({ B4: 5000, B8: 8000 });
    const ndvi = computeSpectralIndex("NDVI", invalid.reflectances);
    expect(ndvi).toBeNull();
  });
});

describe("pixel quality SCL", () => {
  it("pixel quality desconocida no se marca válida en QC", () => {
    const result = evaluateScientificPairQuality({
      stationId: "est-e01",
      fieldSampleId: "m-1",
      parameterCode: "turbidity",
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: false,
      satelliteObservationId: "sat-1",
      satelliteIsSimulated: false,
      matchingStatus: "matched",
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 20,
      cloudPercentage: 5,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "unknown",
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: 0.1, ndmi: null },
    });
    expect(result.qualityStatus).toBe("insufficient_data");
  });

  it("nube en píxel → rejected", () => {
    expect(interpretSclPixelQuality(9)).toBe("cloud");
    expect(isPixelContaminated("cloud")).toBe(true);
  });
});

describe("GEE expressions — trazabilidad", () => {
  it("scene details incluye system:index, time_start y cloud", () => {
    const expr = buildSentinel2SceneDetailsExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });
    expect(expr).toContain("system:index");
    expect(expr).toContain("system:time_start");
    expect(expr).toContain("CLOUDY_PIXEL_PERCENTAGE");
  });

  it("reflectance incluye SCL para QC de píxel", () => {
    const expr = buildSentinel2ReflectanceExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
      sceneId: "S2A_test",
    });
    expect(expr).toContain("'SCL'");
    expect(expr).toContain("S2A_test");
  });
});

describe("GEE live verification service", () => {
  it("reporta GEE_LIVE_UNAVAILABLE sin credenciales", async () => {
    const report = await geeEmpiricalVerificationService.runVerification({
      stationId: "est-e01",
    });
    expect(report.liveExecuted).toBe(false);
    expect(report.status).toBe("GEE_LIVE_UNAVAILABLE");
    expect(report.notes.join(" ")).toMatch(/not executed/i);
    expect(report.scenes).toHaveLength(0);
  });
});

describe("índices faltantes permanecen null", () => {
  it("missing index no rellena con cero", () => {
    const result = evaluateScientificPairQuality({
      stationId: "est-e01",
      fieldSampleId: "m-1",
      parameterCode: "turbidity",
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: false,
      satelliteObservationId: "sat-1",
      satelliteIsSimulated: false,
      matchingStatus: "matched",
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 20,
      cloudPercentage: 5,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: null, ndmi: null },
    });
    expect(result.qualityStatus).toBe("missing_index");
  });
});

/** Fixtures sintéticos — no representan respuestas GEE reales */
const FIXTURE_GEE_SCENE_COMPUTE_RESPONSE = {
  result: {
    "system:index": ["S2A_MSIL2A_20250601T152901_R040_T18LTJ_20250601T180000"],
    "system:time_start": [1_748_789_341_000],
    CLOUDY_PIXEL_PERCENTAGE: [12.4],
  },
};

describe("Prompt 12 — trazabilidad escena (fixtures)", () => {
  it("sceneId == system:index desde respuesta compute", () => {
    const rows = extractSceneDetailsFromComputeValue(FIXTURE_GEE_SCENE_COMPUTE_RESPONSE);
    expect(rows).toHaveLength(1);
    expect(rows[0].sceneId).toBe(rows[0].systemIndex);
    expect(rows[0].sceneId).toBe("S2A_MSIL2A_20250601T152901_R040_T18LTJ_20250601T180000");
  });

  it("acquisitionDate derivada de system:time_start", () => {
    const rows = extractSceneDetailsFromComputeValue(FIXTURE_GEE_SCENE_COMPUTE_RESPONSE);
    const ms = rows[0].systemTimeStart;
    expect(ms).toBe(1_748_789_341_000);
    const derived = systemTimeStartToAcquisitionDate(ms);
    expect(derived).toBe(new Date(ms!).toISOString().slice(0, 10));
    expect(derived).not.toBe("");
  });
});

describe("Prompt 12 — SCL QC en pares", () => {
  function basePairInput(pixelQualityStatus: Parameters<typeof evaluateScientificPairQuality>[0]["pixelQualityStatus"]) {
    return {
      stationId: "est-e01",
      fieldSampleId: "m-1",
      parameterCode: "turbidity" as const,
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: false,
      satelliteObservationId: "sat-1",
      satelliteIsSimulated: false,
      matchingStatus: "matched" as const,
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 20,
      cloudPercentage: 5,
      reflectanceSemanticStatus: "valid" as const,
      pixelQualityStatus,
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: 0.1, ndmi: null },
    };
  }

  it("SCL cloud_shadow → rejected", () => {
    expect(interpretSclPixelQuality(3)).toBe("cloud_shadow");
    const result = evaluateScientificPairQuality(basePairInput("cloud_shadow"));
    expect(result.qualityStatus).toBe("rejected");
  });

  it("SCL valid → accepted cuando resto de QC pasa", () => {
    expect(interpretSclPixelQuality(4)).toBe("valid");
    const result = evaluateScientificPairQuality(basePairInput("valid"));
    expect(result.qualityStatus).toBe("accepted");
  });
});

describe("Prompt 12 — índice NDMI", () => {
  it("NDMI calculable con reflectancias válidas B08/B11", () => {
    const processed = processGeeSurfaceReflectances({ B8: 0.25, B11: 0.12 });
    expect(processed.semanticStatus).toBe("valid");
    const ndmi = computeSpectralIndex("NDMI", processed.reflectances);
    expect(ndmi).not.toBeNull();
    expect(Number.isFinite(ndmi)).toBe(true);
  });
});

describe("Prompt 12 — trazabilidad completa en quality report", () => {
  it("conserva cloud, reflectance y pixel quality por par", () => {
    const pair = makePair({ id: "trace-1", satelliteSceneId: "S2A_trace" });
    const report = buildScientificDatasetQualityReport({
      pairs: [pair],
      totalFieldSamples: 1,
      totalSatelliteObservations: 1,
      totalCandidateMatches: 1,
      traceabilityByPairId: new Map([
        [
          "trace-1",
          {
            cloudPercentage: 8,
            reflectanceSemanticStatus: "valid",
            pixelQualityStatus: "water",
          },
        ],
      ]),
    });
    expect(report.byCloudStatus.known).toBe(1);
    expect(report.byReflectanceStatus.valid).toBe(1);
    expect(report.byPixelQualityStatus.water).toBe(1);
    expect(report.bySatelliteScene["S2A_trace"]).toBe(1);
  });
});

describe("Prompt 12 — simulated no calibration", () => {
  it("pares simulados no alcanzan calibration readiness", () => {
    const simPair = makePair({
      id: "sim-cal",
      isSimulated: true,
      qualityStatus: "simulated_data",
    });
    const readiness = evaluateCalibrationReadiness([simPair]);
    expect(readiness.meetsMinimumExploratoryCriteria).toBe(false);
    expect(readiness.status).toBe("INSUFFICIENT_REAL_DATA");
  });
});

function makePair(overrides: Partial<ScientificFieldSatellitePair> = {}): ScientificFieldSatellitePair {
  return {
    id: "pair-1",
    stationId: "est-e01",
    fieldSampleId: "m-1",
    fieldMeasurementId: "m-1::turbidity",
    parameterCode: "turbidity",
    fieldValue: 12,
    fieldUnit: "NTU",
    fieldDate: "2025-06-01",
    satelliteObservationId: "sat-1",
    satelliteSceneId: "S2A_1",
    satelliteAcquisitionDate: "2025-05-31",
    spectralIndices: { ndti: 0.1, ndvi: null, ndci: null, ndwi: null, mndwi: null, ndmi: null },
    temporalDifferenceDays: 1,
    distanceMeters: 30,
    matchingStatus: "matched",
    qualityStatus: "accepted",
    sourceTypeField: "field",
    sourceTypeSatellite: "satellite",
    isSimulated: false,
    scientificStatus: "descriptive_only",
    candidateRelationships: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("dataset quality metrics", () => {
  it("métricas de calidad son deterministas", () => {
    const pairs = [
      makePair(),
      makePair({
        id: "pair-2",
        qualityStatus: "insufficient_data",
        satelliteSceneId: "S2A_2",
      }),
      makePair({
        id: "pair-3",
        qualityStatus: "simulated_data",
        isSimulated: true,
      }),
    ];

    const report = buildScientificDatasetQualityReport({
      pairs,
      totalFieldSamples: 3,
      totalSatelliteObservations: 2,
      totalCandidateMatches: 3,
      traceabilityByPairId: new Map([
        ["pair-1", { cloudPercentage: 5, reflectanceSemanticStatus: "valid", pixelQualityStatus: "water" }],
        ["pair-2", { cloudPercentage: null, reflectanceSemanticStatus: "valid", pixelQualityStatus: "unknown" }],
        ["pair-3", { cloudPercentage: 12, reflectanceSemanticStatus: "valid", pixelQualityStatus: "valid" }],
      ]),
    });

    expect(report.totalAcceptedPairs).toBe(1);
    expect(report.totalInsufficientPairs).toBe(1);
    expect(report.simulatedPairRate).toBeCloseTo(1 / 3, 3);
    expect(report.cloudUnknownRate).toBeCloseTo(1 / 3, 3);
    expect(report.byQualityStatus.accepted).toBe(1);
  });

  it("datos simulados no entran en accepted", () => {
    const sim = evaluateScientificPairQuality({
      stationId: "est-e01",
      fieldSampleId: "m-s",
      parameterCode: "turbidity",
      fieldValue: 10,
      fieldUnit: "NTU",
      fieldDate: "2025-06-01",
      fieldIsSimulated: true,
      satelliteObservationId: "sat-s",
      satelliteIsSimulated: true,
      matchingStatus: "matched",
      operationallyCompatible: true,
      temporalDifferenceDays: 1,
      distanceMeters: 0,
      cloudPercentage: 5,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "valid",
      spectralIndices: { ndvi: null, ndci: null, ndwi: null, mndwi: null, ndti: 0.1, ndmi: null },
    });
    expect(sim.qualityStatus).toBe("simulated_data");
  });
});
