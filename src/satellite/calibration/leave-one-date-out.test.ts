import { describe, expect, it } from "vitest";
import {
  computePooledMetrics,
  leaveOneDateOut,
} from "@/satellite/calibration/leave-one-date-out";
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
    satelliteProvider: "planetary",
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
    expect(result.pooled.n).toBe(12);
    expect(result.pooled.r2).toBeCloseTo(1, 3);
    expect(result.pooled.rmse).toBeCloseTo(0, 3);
    expect(result.pooled.mae).toBeCloseTo(0, 3);
    expect(result.pooled.r2Ci95?.lower).toBeCloseTo(1, 3);
    expect(result.pooled.r2Ci95?.upper).toBeCloseTo(1, 3);
    expect(result.note).toContain("agrupados");
  });

  it("agrupa todas las predicciones fuera de muestra (no promedia R² por fecha)", () => {
    // Ruido determinista: cada fecha tiene poca varianza propia, así que el R² por fecha
    // es inestable, pero el agrupado sobre las 15 predicciones sí es informativo.
    const noise = [0.3, -0.2, 0.1, -0.4, 0.2, 0.0, 0.25, -0.1, -0.3, 0.15, 0.05, -0.25, 0.35, -0.05, 0.1];
    const pairs: ScientificFieldSatellitePair[] = [];
    const dates = ["2025-01-10", "2025-02-10", "2025-03-10", "2025-04-10", "2025-05-10"];
    let i = 0;
    dates.forEach((date, d) => {
      for (const x of [0.1, 0.2, 0.3]) {
        const xd = x + d * 0.15;
        pairs.push(pair(date, xd, 10 * xd + 1 + noise[i], i));
        i += 1;
      }
    });

    const result = leaveOneDateOut(pairs, "turbidity", "NDTI");

    expect(result.evaluatedFolds).toBe(5);
    expect(result.pooled.n).toBe(15);
    expect(result.pooled.r2).not.toBeNull();
    expect(result.pooled.r2!).toBeGreaterThan(0.8);
    // el agrupado no es la media de los folds
    expect(result.pooled.r2).not.toBeCloseTo(result.meanR2 ?? 0, 2);
    const ci = result.pooled.r2Ci95!;
    expect(ci.lower).toBeLessThanOrEqual(result.pooled.r2!);
    expect(ci.upper).toBeGreaterThanOrEqual(result.pooled.r2!);
    expect(ci.lower).toBeLessThan(ci.upper);
    expect(result.pooled.bootstrapIterations).toBe(2000);
  });

  it("el intervalo bootstrap es reproducible con la misma semilla", () => {
    const preds = [
      { predicted: 1.1, observed: 1.0 },
      { predicted: 2.3, observed: 2.0 },
      { predicted: 2.8, observed: 3.1 },
      { predicted: 4.2, observed: 3.9 },
      { predicted: 4.7, observed: 5.2 },
      { predicted: 6.1, observed: 5.8 },
    ];
    const a = computePooledMetrics(preds, { iterations: 500, seed: 7 });
    const b = computePooledMetrics(preds, { iterations: 500, seed: 7 });
    expect(a.r2Ci95).toEqual(b.r2Ci95);
    expect(a.rmseCi95).toEqual(b.rmseCi95);
    // media 3,5 · SS_tot = 17 · SS_res = 0,62 → R² = 1 − 0,62/17
    expect(a.r2).toBeCloseTo(0.9635, 3);
  });

  it("no calcula intervalo con menos de 5 predicciones fuera de muestra", () => {
    const pooled = computePooledMetrics([
      { predicted: 1, observed: 1.1 },
      { predicted: 2, observed: 1.9 },
      { predicted: 3, observed: 3.2 },
    ]);
    expect(pooled.n).toBe(3);
    expect(pooled.r2).not.toBeNull();
    expect(pooled.r2Ci95).toBeNull();
    expect(pooled.rmseCi95).toBeNull();
    expect(pooled.bootstrapIterations).toBe(0);
  });

  it("no evalúa con una sola fecha", () => {
    const pairs = [pair("2025-01-10", 0.1, 1.2, 0), pair("2025-01-10", 0.2, 1.4, 1)];
    const result = leaveOneDateOut(pairs, "turbidity", "NDTI");
    expect(result.evaluatedFolds).toBe(0);
    expect(result.pooled.n).toBe(0);
    expect(result.pooled.r2).toBeNull();
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
