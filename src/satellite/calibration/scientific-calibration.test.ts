/**
 * Tests — calibración exploratoria y auditoría (deterministas, sin GEE/DB).
 */

import { describe, expect, it } from "vitest";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";
import { buildScientificDatasetAuditReport } from "@/satellite/calibration/scientific-dataset-audit";
import {
  evaluateParameterReadiness,
  isReadinessSufficientForCalibration,
} from "@/satellite/calibration/calibration-readiness";
import { runExploratoryCalibration } from "@/satellite/calibration/exploratory-calibration";
import {
  assertNoTemporalLeakage,
  splitPairsByTemporalOrder,
  TemporalLeakageError,
} from "@/satellite/calibration/temporal-split";
import { fitLinearRegression, predictLinear } from "@/satellite/calibration/linear-regression";
import {
  computeMAE,
  computeRMSE,
  computeR2,
  computeRegressionMetrics,
} from "@/satellite/calibration/regression-metrics";
import { filterRealCalibrationPairs } from "@/satellite/calibration/spectral-index-access";
import { MIN_EXPLORATORY_READINESS } from "@/satellite/config/calibration-readiness.config";

function makeRealPair(
  index: number,
  overrides: Partial<ScientificFieldSatellitePair> = {}
): ScientificFieldSatellitePair {
  const month = String(Math.floor(index / 30) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  const stationNum = index % 3;
  const stationId = `est-real-${stationNum}`;

  return {
    id: `pair-${index}`,
    stationId,
    fieldSampleId: `m-${index}`,
    fieldMeasurementId: `m-${index}::turbidity`,
    parameterCode: "turbidity",
    fieldValue: 10 + index * 0.5,
    fieldUnit: "NTU",
    fieldDate: `2025-${month}-${day}T12:00:00.000Z`,
    satelliteObservationId: `sat-${index}`,
    satelliteSceneId: `S2A_${index}`,
    satelliteAcquisitionDate: `2025-${month}-${day}`,
    spectralIndices: {
      ndvi: 0.1,
      ndci: null,
      ndwi: 0.05,
      mndwi: null,
      ndti: 0.02 + index * 0.001,
      ndmi: null,
    },
    temporalDifferenceDays: 1,
    distanceMeters: 50,
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

function makeRealDataset(count: number): ScientificFieldSatellitePair[] {
  return Array.from({ length: count }, (_, i) => makeRealPair(i));
}

describe("filterRealCalibrationPairs", () => {
  it("4. excluye datos simulados", () => {
    const pairs = [
      makeRealPair(0),
      makeRealPair(1, { isSimulated: true }),
      makeRealPair(2, { qualityStatus: "simulated_data" as "accepted" }),
    ];
    const real = filterRealCalibrationPairs(pairs);
    expect(real).toHaveLength(1);
    expect(real[0].isSimulated).toBe(false);
  });
});

describe("evaluateParameterReadiness", () => {
  it("1. dataset real insuficiente", () => {
    const pairs = makeRealDataset(5);
    const readiness = evaluateParameterReadiness(pairs, "turbidity", "NDTI");
    expect(readiness.meetsMinimumExploratoryCriteria).toBe(false);
    expect(["INSUFFICIENT_REAL_DATA", "INSUFFICIENT_TEMPORAL_COVERAGE", "INSUFFICIENT_STATION_COVERAGE"]).toContain(
      readiness.status
    );
  });

  it("2. dataset suficiente", () => {
    const pairs = makeRealDataset(35);
    const readiness = evaluateParameterReadiness(pairs, "turbidity", "NDTI");
    expect(isReadinessSufficientForCalibration(readiness.status)).toBe(true);
  });

  it("3. readiness por parámetro — phosphates sin datos", () => {
    const pairs = makeRealDataset(35);
    const readiness = evaluateParameterReadiness(pairs, "phosphates", "NDCI");
    expect(readiness.status).toBe("INSUFFICIENT_REAL_DATA");
  });

  it("13. parámetro sin predictor candidato", () => {
    const pairs = makeRealDataset(35);
    const readiness = evaluateParameterReadiness(pairs, "turbidity", "NDMI");
    expect(readiness.status).toBe("INSUFFICIENT_PARAMETER_COVERAGE");
  });
});

describe("buildScientificDatasetAuditReport", () => {
  it("genera audit con pares reales y simulados", () => {
    const pairs = [...makeRealDataset(10), makeRealPair(99, { isSimulated: true })];
    const audit = buildScientificDatasetAuditReport(pairs);
    expect(audit.totalPairs).toBe(11);
    expect(audit.realPairs).toBe(10);
    expect(audit.simulatedPairs).toBe(1);
    expect(audit.calibrationReadiness.status).toBe("INSUFFICIENT_REAL_DATA");
  });
});

describe("temporal split", () => {
  it("5. split temporal cronológico", () => {
    const pairs = makeRealDataset(40);
    const split = splitPairsByTemporalOrder(pairs);
    expect(split).not.toBeNull();
    expect(split!.training.length).toBeGreaterThanOrEqual(MIN_EXPLORATORY_READINESS.minTrainingSetSize);
    expect(split!.validation.length).toBeGreaterThanOrEqual(MIN_EXPLORATORY_READINESS.minValidationSetSize);
    expect(split!.training[0].fieldDate <= split!.validation[0].fieldDate).toBe(true);
  });

  it("6. leakage detection — split válido no lanza", () => {
    const pairs = makeRealDataset(40);
    const split = splitPairsByTemporalOrder(pairs)!;
    expect(() => assertNoTemporalLeakage(split.training, split.validation)).not.toThrow();
  });

  it("6b. leakage detection — mezcla inválida lanza", () => {
    const pairs = makeRealDataset(10);
    expect(() => assertNoTemporalLeakage(pairs.slice(5), pairs.slice(0, 5))).toThrow(TemporalLeakageError);
  });
});

describe("linear regression", () => {
  it("7. regresión lineal simple y=2+3x", () => {
    const x = [1, 2, 3, 4, 5];
    const y = x.map((v) => 2 + 3 * v);
    const coef = fitLinearRegression(x, y)!;
    expect(coef.coefficientA).toBeCloseTo(2, 5);
    expect(coef.coefficientB).toBeCloseTo(3, 5);
    expect(predictLinear(coef, 10)).toBeCloseTo(32, 5);
  });
});

describe("regression metrics", () => {
  it("8. MAE", () => {
    expect(computeMAE([10, 20], [12, 18])).toBe(2);
  });

  it("9. RMSE", () => {
    expect(computeRMSE([10, 20], [10, 10])).toBeCloseTo(7.071, 2);
  });

  it("10. R² perfecto", () => {
    const x = [1, 2, 3, 4];
    const y = [2, 4, 6, 8];
    const coef = fitLinearRegression(x, y)!;
    const pred = x.map((v) => predictLinear(coef, v));
    expect(computeR2(y, pred)).toBeCloseTo(1, 5);
  });

  it("11. validation independiente — métricas separadas", () => {
    const trainX = [1, 2, 3, 4, 5];
    const trainY = trainX.map((v) => 1 + 2 * v);
    const valX = [6, 7, 8];
    const valY = valX.map((v) => 1 + 2 * v);
    const coef = fitLinearRegression(trainX, trainY)!;
    const trainMetrics = computeRegressionMetrics(trainY, trainX.map((v) => predictLinear(coef, v)));
    const valMetrics = computeRegressionMetrics(valY, valX.map((v) => predictLinear(coef, v)));
    expect(trainMetrics.r2).toBeCloseTo(1, 3);
    expect(valMetrics.r2).toBeCloseTo(1, 3);
  });
});

describe("runExploratoryCalibration", () => {
  it("calibra cuando hay datos suficientes", () => {
    const pairs = makeRealDataset(40);
    const result = runExploratoryCalibration({
      pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model).not.toBeNull();
    expect(result.model!.modelType).toBe("linear_regression");
    expect(result.model!.scientificStatus).toBe("exploratory_calibration");
    expect(result.model!.validationStatus).toBe("validated");
    expect(result.model!.trainingMetrics).toHaveProperty("mae");
    expect(result.model!.validationMetrics).toHaveProperty("r2");
    expect(result.model).not.toHaveProperty("predictedValue");
  });

  it("12. modelo insufficient_data con pocos pares", () => {
    const result = runExploratoryCalibration({
      pairs: makeRealDataset(10),
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model).toBeNull();
    expect(result.validationStatus).toBe("insufficient_data");
  });

  it("14. índices null — insufficient", () => {
    const pairs = makeRealDataset(35).map((p) => ({
      ...p,
      spectralIndices: { ...p.spectralIndices, ndti: null },
    }));
    const result = runExploratoryCalibration({
      pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model).toBeNull();
    expect(["INSUFFICIENT_REAL_DATA", "INSUFFICIENT_INDEX_COVERAGE"]).toContain(result.readiness.status);
  });

  it("15. estación dominante genera warnings", () => {
    const pairs = makeRealDataset(35).map((p, i) =>
      makeRealPair(i, { stationId: i < 30 ? "est-dom" : `est-${i % 3}` })
    );
    const result = runExploratoryCalibration({
      pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model!.warnings.some((w) => /estación|dominante/i.test(w))).toBe(true);
  });

  it("17. scientificStatus exploratory_calibration", () => {
    const result = runExploratoryCalibration({
      pairs: makeRealDataset(40),
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model!.scientificStatus).toBe("exploratory_calibration");
    expect(result.model!.disclaimer).toMatch(/exploratoria/i);
    expect(result.model!.disclaimer).toMatch(/R²/i);
  });
});

describe("ScientificCalibrationService (mock path)", () => {
  it("16. mock devuelve INSUFFICIENT_REAL_DATA", async () => {
    const { scientificCalibrationService, CalibrationInsufficientDataError } = await import(
      "@/server/satellite/calibration/scientific-calibration.service"
    );
    const { setDataProvider, resetDataProvider } = await import("@/data/store-access");
    const { mockDataProvider } = await import("@/providers/mock-data.provider");

    resetDataProvider();
    setDataProvider(mockDataProvider);

    const audit = await scientificCalibrationService.audit({
      stationId: "est-e01",
      fechaInicio: "2025-01-01",
      fechaFin: "2025-12-31",
      parameterCode: "turbidity",
    });

    expect(audit.meta.isSimulated).toBe(true);
    expect(audit.audit.calibrationReadiness.status).toBe("INSUFFICIENT_REAL_DATA");

    await expect(
      scientificCalibrationService.run({
        stationId: "est-e01",
        parameterCode: "turbidity",
        predictorIndex: "NDTI",
        fechaInicio: "2025-01-01",
        fechaFin: "2025-12-31",
      })
    ).rejects.toBeInstanceOf(CalibrationInsufficientDataError);

    resetDataProvider();
  }, 15_000);
});

describe("trained vs validated", () => {
  it("trained ≠ validated cuando validación es mínima", () => {
    const pairs = makeRealDataset(20);
    const result = runExploratoryCalibration({
      pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model).toBeNull();
    expect(result.validationStatus).toBe("insufficient_data");
  });
});
