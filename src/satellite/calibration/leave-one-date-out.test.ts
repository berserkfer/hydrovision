import { describe, expect, it } from "vitest";
import { leaveOneDateOut } from "@/satellite/calibration/leave-one-date-out";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";

function pair(date: string, x: number, y: number, index: number): ScientificFieldSatellitePair {
  return {
    id: `pair-${date}-${index}`,
    stationId: "P6",
    fieldSampleId: `sample-${date}-${index}`,
    fieldMeasurementId: `measurement-${date}-${index}`,
    parameterCode: "turbidity",
    fieldValue: y,
    fieldUnit: "NTU",
    fieldDate: `${date}T00:00:00-05:00`,
    satelliteObservationId: `obs-${date}`,
    satelliteSceneId: `scene-${date}`,
    satelliteAcquisitionDate: date,
    spectralIndices: {
      ndvi: null,
      ndci: null,
      ndwi: null,
      mndwi: null,
      ndti: x,
      ndmi: null,
    },
    temporalDifferenceDays: 1,
    distanceMeters: 30,
    matchingStatus: "matched",
    qualityStatus: "accepted",
    sourceTypeField: "field",
    sourceTypeSatellite: "satellite",
    isSimulated: false,
    scientificStatus: "descriptive_only",
    candidateRelationships: [],
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("leaveOneDateOut", () => {
  it("evalúa una fecha por fold y recupera una relación lineal exacta", () => {
    const pairs: ScientificFieldSatellitePair[] = [];
    const dates = ["2025-01-10", "2025-02-10", "2025-03-10", "2025-04-10"];
    let i = 0;
    for (const date of dates) {
      for (const x of [0.1, 0.2, 0.3]) {
        pairs.push(pair(date, x, 2 * x + 1, i++));
      }
    }

    const result = leaveOneDateOut(pairs, "turbidity", "NDTI");

    expect(result.strategy).toBe("leave_one_date_out");
    expect(result.evaluatedFolds).toBe(4);
    expect(result.folds).toHaveLength(4);
    expect(result.folds.every((f) => f.validationCount === 3)).toBe(true);
    expect(result.meanR2).toBeCloseTo(1, 3);
    expect(result.meanRmse).toBeCloseTo(0, 3);
    expect(result.meanMae).toBeCloseTo(0, 3);
    expect(result.pooledBias).toBeCloseTo(0, 3);
  });

  it("no evalúa con una sola fecha", () => {
    const pairs = [pair("2025-01-10", 0.1, 1.2, 0), pair("2025-01-10", 0.2, 1.4, 1)];
    const result = leaveOneDateOut(pairs, "turbidity", "NDTI");
    expect(result.evaluatedFolds).toBe(0);
    expect(result.note).toContain("dos fechas");
  });

  it("omite folds sin entrenamiento suficiente", () => {
    const pairs = [
      pair("2025-01-10", 0.1, 1.2, 0),
      pair("2025-01-10", 0.2, 1.4, 1),
      pair("2025-02-10", 0.15, 1.3, 2),
      pair("2025-02-10", 0.25, 1.5, 3),
    ];
    const result = leaveOneDateOut(pairs, "turbidity", "NDTI", { minTrainingPairs: 5 });
    expect(result.evaluatedFolds).toBe(0);
    expect(result.skippedFolds).toBe(2);
    expect(result.folds.every((f) => f.status === "skipped_insufficient_training")).toBe(true);
  });

  it("ignora pares no aceptados o simulados", () => {
    const pairs = [
      pair("2025-01-10", 0.1, 1.2, 0),
      { ...pair("2025-01-10", 0.2, 1.4, 1), qualityStatus: "rejected" as const },
      { ...pair("2025-02-10", 0.2, 1.4, 2), isSimulated: true },
    ];
    const result = leaveOneDateOut(pairs, "turbidity", "NDTI");
    expect(result.evaluatedFolds).toBe(0);
  });
});
