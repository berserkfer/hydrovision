/**
 * Tests — builder del dataset científico (determinista, sin GEE/DB).
 */

import { describe, expect, it } from "vitest";
import type { FieldSatelliteComparison } from "@/satellite/types/field-satellite-comparison.types";
import {
  buildScientificDatasetSummary,
  buildScientificFieldSatellitePairs,
  evaluateAllComparisonQualities,
  filterPairsByIncludeSimulated,
  toScientificDatasetExportRow,
} from "@/server/satellite/validation/scientific-dataset.builder";
import { SCIENTIFIC_DATASET_DISCLAIMER } from "@/satellite/types/scientific-dataset.types";

function makeComparison(
  overrides: Partial<FieldSatelliteComparison> & {
    field?: Partial<FieldSatelliteComparison["field"]>;
    satellite?: Partial<FieldSatelliteComparison["satellite"]>;
    matching?: Partial<FieldSatelliteComparison["matching"]>;
  } = {}
): FieldSatelliteComparison {
  const { field, satellite, matching, ...rest } = overrides;
  return {
    stationId: "est-e01",
    field: {
      parameterCode: "turbidity",
      value: 15.2,
      unit: "NTU",
      date: "2025-06-15",
      sampleId: "m-001",
      sourceType: "field",
      isSimulated: false,
      ...field,
    },
    satellite: {
      acquisitionDate: "2025-06-14",
      sceneId: "S2A_20250614",
      observationId: "sat-001",
      indices: { NDTI: 0.12, NDWI: 0.05 },
      cloudPercentage: 5,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      sourceType: "satellite",
      isSimulated: false,
      ...satellite,
    },
    matching: {
      status: "matched",
      temporalDifferenceDays: 1,
      distanceMeters: 30,
      operationallyCompatible: true,
      ...matching,
    },
    candidateRelationships: [
      {
        fieldParameterCode: "turbidity",
        potentialExplanatoryIndices: ["NDTI", "MNDWI"],
        relationshipKind: "candidate_relationship",
        disclaimer: "No implica equivalencia directa",
      },
    ],
    scientificStatus: "descriptive_only",
    disclaimers: ["Comparación descriptiva"],
    ...rest,
  };
}

describe("buildScientificFieldSatellitePairs", () => {
  it("construye par válido con trazabilidad de IDs", () => {
    const pairs = buildScientificFieldSatellitePairs([makeComparison()]);
    expect(pairs).toHaveLength(1);

    const pair = pairs[0];
    expect(pair.id).toBe("est-e01::m-001::turbidity::sat-001");
    expect(pair.fieldMeasurementId).toBe("m-001::turbidity");
    expect(pair.fieldSampleId).toBe("m-001");
    expect(pair.satelliteObservationId).toBe("sat-001");
    expect(pair.satelliteSceneId).toBe("S2A_20250614");
    expect(pair.qualityStatus).toBe("accepted");
    expect(pair.scientificStatus).toBe("descriptive_only");
    expect(pair.sourceTypeField).toBe("field");
    expect(pair.sourceTypeSatellite).toBe("satellite");
  });

  it("14. scientificStatus siempre descriptive_only", () => {
    const pairs = buildScientificFieldSatellitePairs([
      makeComparison(),
      makeComparison({ field: { isSimulated: true } }),
    ]);
    for (const pair of pairs) {
      expect(pair.scientificStatus).toBe("descriptive_only");
    }
  });

  it("omite pares con valor no numérico del array pero evalúa calidad", () => {
    const comparisons = [makeComparison({ field: { value: null } })];
    const pairs = buildScientificFieldSatellitePairs(comparisons);
    expect(pairs).toHaveLength(0);

    const qualities = evaluateAllComparisonQualities(comparisons);
    expect(qualities[0]).toBe("invalid_measurement");
  });

  it("registra índices faltantes como null", () => {
    const pairs = buildScientificFieldSatellitePairs([
      makeComparison({ satellite: { indices: { NDTI: 0.1 } } }),
    ]);
    expect(pairs[0].spectralIndices.ndti).toBe(0.1);
    expect(pairs[0].spectralIndices.ndvi).toBeNull();
  });
});

describe("filterPairsByIncludeSimulated", () => {
  const pairs = buildScientificFieldSatellitePairs([
    makeComparison(),
    makeComparison({
      field: { isSimulated: true, sampleId: "m-002" },
      satellite: { observationId: "sat-002", sceneId: "S2A_20250620" },
    }),
  ]);

  it("10. includeSimulated=false excluye simulados", () => {
    const { included, excludedSimulatedCount } = filterPairsByIncludeSimulated(pairs, false);
    expect(included.every((p) => !p.isSimulated)).toBe(true);
    expect(excludedSimulatedCount).toBe(1);
    expect(included).toHaveLength(1);
  });

  it("11. includeSimulated=true incluye simulados", () => {
    const { included, excludedSimulatedCount } = filterPairsByIncludeSimulated(pairs, true);
    expect(included).toHaveLength(2);
    expect(excludedSimulatedCount).toBe(0);
    expect(included.some((p) => p.isSimulated)).toBe(true);
  });
});

describe("buildScientificDatasetSummary", () => {
  it("12. calcula summary correcto sin correlaciones", () => {
    const comparisons = [
      makeComparison(),
      makeComparison({
        field: { isSimulated: true, sampleId: "m-sim" },
        satellite: { observationId: "sat-sim", sceneId: "S2A_sim" },
      }),
      makeComparison({
        field: { sampleId: "m-temp", value: 8.0 },
        matching: {
          status: "temporal_mismatch",
          operationallyCompatible: false,
          temporalDifferenceDays: 12,
        },
        satellite: { observationId: "sat-temp", sceneId: "S2A_temp" },
      }),
    ];

    const allPairs = buildScientificFieldSatellitePairs(comparisons);
    const { included, excludedSimulatedCount } = filterPairsByIncludeSimulated(allPairs, false);
    const allQualityStatuses = evaluateAllComparisonQualities(comparisons);

    const summary = buildScientificDatasetSummary(
      allPairs,
      included,
      excludedSimulatedCount,
      allQualityStatuses
    );

    expect(summary.totalPairs).toBe(3);
    expect(summary.acceptedPairs).toBe(1);
    expect(summary.simulatedPairs).toBe(1);
    expect(summary.excludedSimulatedPairs).toBe(1);
    expect(summary.stationsCount).toBe(1);
    expect(summary.parametersCount).toBe(1);
    expect(summary.scenesCount).toBe(2);
    expect(summary.qualityBreakdown.accepted).toBe(1);
    expect(summary.qualityBreakdown.simulated_data).toBe(1);
    expect(summary.qualityBreakdown.temporal_mismatch).toBe(1);

    expect(summary).not.toHaveProperty("correlation");
    expect(summary).not.toHaveProperty("r2");
    expect(summary).not.toHaveProperty("regressionCoefficient");

    expect(summary.temporalDifferenceStatistics.min).toBe(1);
    expect(summary.temporalDifferenceStatistics.count).toBe(2);
    expect(summary.dateRange.fieldDateMin).toBe("2025-06-15");
  });
});

describe("toScientificDatasetExportRow", () => {
  it("genera fila plana sin columnas predictivas", () => {
    const pairs = buildScientificFieldSatellitePairs([makeComparison()]);
    const row = toScientificDatasetExportRow(pairs[0]);

    expect(row.station_id).toBe("est-e01");
    expect(row.field_sample_id).toBe("m-001");
    expect(row.field_measurement_id).toBe("m-001::turbidity");
    expect(row.quality_status).toBe("accepted");
    expect(row.scientific_status).toBe("descriptive_only");
    expect(row.ndti).toBe(0.12);
    expect(row.ndvi).toBeNull();

    expect(row).not.toHaveProperty("predicted_value");
    expect(row).not.toHaveProperty("correlation");
    expect(row).not.toHaveProperty("r2");
  });
});

describe("SCIENTIFIC_DATASET_DISCLAIMER", () => {
  it("contiene disclaimer de integridad científica", () => {
    expect(SCIENTIFIC_DATASET_DISCLAIMER).toMatch(/NO implica equivalencia física/i);
    expect(SCIENTIFIC_DATASET_DISCLAIMER).toMatch(/calibración/i);
  });
});

describe("ScientificDatasetService (mock path)", () => {
  it("integra validation → builder → response descriptiva", async () => {
    const { scientificDatasetService } = await import(
      "@/server/satellite/validation/scientific-dataset.service"
    );
    const { setDataProvider, resetDataProvider } = await import("@/data/store-access");
    const { mockDataProvider } = await import("@/providers/mock-data.provider");

    resetDataProvider();
    setDataProvider(mockDataProvider);

    const result = await scientificDatasetService.buildDataset({
      stationId: "est-e01",
      fechaInicio: "2025-01-01",
      fechaFin: "2025-12-31",
      parameterCode: "turbidity",
      includeSimulated: false,
    });

    expect(result.meta.scientificStatus).toBe("descriptive_only");
    expect(result.meta.disclaimer).toBe(SCIENTIFIC_DATASET_DISCLAIMER);
    expect(result.meta.includeSimulated).toBe(false);

    for (const pair of result.pairs) {
      expect(pair.scientificStatus).toBe("descriptive_only");
      expect(pair).not.toHaveProperty("predictedValue");
      expect(pair).not.toHaveProperty("correlation");
    }

    expect(result.summary.excludedSimulatedPairs).toBeGreaterThanOrEqual(0);

    resetDataProvider();
  }, 15_000);
});
