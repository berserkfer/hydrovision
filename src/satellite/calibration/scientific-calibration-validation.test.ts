/**
 * Tests — validación científica exploratoria de calibración (deterministas, sin GEE/DB).
 */

import { describe, expect, it } from "vitest";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";
import type { ScientificCalibrationModel } from "@/satellite/types/scientific-calibration.types";
import { runExploratoryCalibration } from "@/satellite/calibration/exploratory-calibration";
import {
  isValidationSuccessful,
  validateCalibrationModel,
  toCalibrationValidationExportRow,
} from "@/satellite/calibration/calibration-model-validation";
import { analyzeCalibrationDataQuality } from "@/satellite/calibration/calibration-data-quality";
import { assertNoTemporalLeakage, TemporalLeakageError } from "@/satellite/calibration/temporal-split";
import { CALIBRATION_VALIDATION_DISCLAIMERS } from "@/satellite/config/calibration-validation.config";

function makeRealPair(
  index: number,
  overrides: Partial<ScientificFieldSatellitePair> = {}
): ScientificFieldSatellitePair {
  const month = String(Math.floor(index / 30) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  const stationId = `est-real-${index % 3}`;

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

function buildModelFromPairs(pairs: ScientificFieldSatellitePair[]): ScientificCalibrationModel {
  const result = runExploratoryCalibration({
    pairs,
    parameterCode: "turbidity",
    predictorIndex: "NDTI",
  });
  if (!result.model) throw new Error("Expected model");
  return result.model;
}

describe("validateCalibrationModel", () => {
  it("1. modelo válido → VALIDATED_EXPLORATORY o VALIDATED_WITH_WARNINGS", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });

    expect(isValidationSuccessful(validation.validationStatus)).toBe(true);
    expect(validation.modelTrainingStatus).toBe("validated");
    expect(validation.temporalLeakageCheck).toBe("passed");
    expect(validation.scientificStatus).toBe("validated_exploratory");
    expect(Number.isFinite(validation.coefficientA)).toBe(true);
    expect(Number.isFinite(validation.coefficientB)).toBe(true);
  });

  it("2. modelo insuficiente", () => {
    const pairs = makeRealDataset(10);
    const result = runExploratoryCalibration({
      pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(result.model).toBeNull();
    expect(result.validationStatus).toBe("insufficient_data");
  });

  it("3. modelo con NaN en coeficientes → INVALID_MODEL", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.coefficientA = NaN;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("INVALID_MODEL");
    expect(validation.robustnessStatus).toBe("invalid");
  });

  it("4. modelo con Infinity → INVALID_MODEL", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.coefficientB = Infinity;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("INVALID_MODEL");
  });

  it("5. temporal leakage en modelo → TEMPORAL_LEAKAGE", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.temporalSplit.validationPeriod.start = model.temporalSplit.trainingPeriod.start;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("TEMPORAL_LEAKAGE");
    expect(validation.temporalLeakageCheck).toBe("failed");
  });

  it("5b. assertNoTemporalLeakage lanza con mezcla inválida", () => {
    const pairs = makeRealDataset(10);
    expect(() => assertNoTemporalLeakage(pairs.slice(5), pairs.slice(0, 5))).toThrow(
      TemporalLeakageError
    );
  });

  it("6. validation insuficiente — trained ≠ validated", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.validationStatus = "trained";
    model.validationSampleCount = 3;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("INSUFFICIENT_VALIDATION_DATA");
    expect(validation.modelTrainingStatus).toBe("trained");
  });

  it("7. training/validation muy diferentes → possible_overfitting_signal", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.trainingMetrics = { mae: 0.1, rmse: 0.1, r2: 0.99 };
    model.validationMetrics = { mae: 5.0, rmse: 6.0, r2: -0.5 };

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.trainingValidationComparison.possibleOverfittingSignal).toBe(true);
    expect(validation.robustnessStatus).toBe("warning");
    expect(validation.warnings.some((w) => /overfitting/i.test(w))).toBe(true);
  });

  it("8. estación dominante → advertencia", () => {
    const pairs = makeRealDataset(40).map((p, i) =>
      makeRealPair(i, { stationId: i < 35 ? "est-dom" : `est-${i}` })
    );
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });

    expect(validation.dominantStationShare).toBeGreaterThan(0.8);
    expect(validation.warnings.some((w) => /dominante/i.test(w))).toBe(true);
    expect(validation.validationStatus).toBe("VALIDATED_WITH_WARNINGS");
  });

  it("9. coeficiente finito reportado con signo", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });

    expect(["positive", "negative", "zero"]).toContain(validation.coefficientSign);
    expect(Number.isFinite(validation.coefficientB)).toBe(true);
  });

  it("10. coeficiente inválido", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.coefficientA = NaN;
    model.coefficientB = NaN;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("INVALID_MODEL");
  });

  it("11. datos simulados excluidos", () => {
    const pairs = [
      ...makeRealDataset(5),
      makeRealPair(99, { isSimulated: true }),
    ];
    const report = analyzeCalibrationDataQuality({
      allPairs: pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(report.discardReasons.simulated).toBe(1);
  });

  it("12. índices null descartados", () => {
    const pairs = makeRealDataset(5).map((p) => ({
      ...p,
      spectralIndices: { ...p.spectralIndices, ndti: null },
    }));
    const report = analyzeCalibrationDataQuality({
      allPairs: pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(report.discardReasons.nullPredictor).toBe(5);
    expect(report.effectiveObservationsUsed).toBe(0);
  });

  it("13. valores de campo inválidos descartados", () => {
    const pairs = [makeRealPair(0, { fieldValue: NaN })];
    const report = analyzeCalibrationDataQuality({
      allPairs: pairs,
      parameterCode: "turbidity",
      predictorIndex: "NDTI",
    });
    expect(report.discardReasons.invalidFieldValue).toBe(1);
  });

  it("14. VALIDATED_EXPLORATORY cuando robusto", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });

    if (validation.warnings.length === 0 && !validation.trainingValidationComparison.possibleOverfittingSignal) {
      expect(validation.validationStatus).toBe("VALIDATED_EXPLORATORY");
      expect(validation.robustnessStatus).toBe("robust_exploratory");
    }
  });

  it("15. VALIDATED_WITH_WARNINGS con overfitting signal", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    model.trainingMetrics.r2 = 0.95;
    model.validationMetrics.r2 = 0.2;

    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.validationStatus).toBe("VALIDATED_WITH_WARNINGS");
  });

  it("18. disclaimer obligatorio", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });

    expect(validation.disclaimer).toMatch(/VALIDATED_EXPLORATORY/i);
    expect(validation.disclaimer).toMatch(/NO equivale/i);
    expect(CALIBRATION_VALIDATION_DISCLAIMERS.notScientificallyValidated).toMatch(/definitiva/i);
  });

  it("export row sin datos personales", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    const validation = validateCalibrationModel({ model, pairs });
    const row = toCalibrationValidationExportRow(model, validation);

    expect(row.parameter_code).toBe("turbidity");
    expect(row.predictor_index).toBe("NDTI");
    expect(row).not.toHaveProperty("predicted_value");
    expect(row).not.toHaveProperty("user");
  });
});

describe("ScientificCalibrationService.validate (mock path)", () => {
  it("16. HTTP 422 con datos mock", async () => {
    const { scientificCalibrationService, CalibrationValidateInsufficientError } = await import(
      "@/server/satellite/calibration/scientific-calibration.service"
    );
    const { setDataProvider, resetDataProvider } = await import("@/data/store-access");
    const { mockDataProvider } = await import("@/providers/mock-data.provider");

    resetDataProvider();
    setDataProvider(mockDataProvider);

    await expect(
      scientificCalibrationService.validate({
        stationId: "est-e01",
        parameterCode: "turbidity",
        predictorIndex: "NDTI",
        fechaInicio: "2025-01-01",
        fechaFin: "2025-12-31",
      })
    ).rejects.toBeInstanceOf(CalibrationValidateInsufficientError);

    resetDataProvider();
  }, 15_000);

  it("17. SIMULATED_DATA en mock", async () => {
    const { scientificCalibrationService, CalibrationValidateInsufficientError } = await import(
      "@/server/satellite/calibration/scientific-calibration.service"
    );
    const { setDataProvider, resetDataProvider } = await import("@/data/store-access");
    const { mockDataProvider } = await import("@/providers/mock-data.provider");

    resetDataProvider();
    setDataProvider(mockDataProvider);

    try {
      await scientificCalibrationService.validate({
        stationId: "est-e01",
        parameterCode: "turbidity",
        predictorIndex: "NDTI",
      });
      expect.fail("Should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(CalibrationValidateInsufficientError);
      expect((e as InstanceType<typeof CalibrationValidateInsufficientError>).payload.status).toBe(
        "SIMULATED_DATA"
      );
    }

    resetDataProvider();
  });
});

describe("TRAINED ≠ VALIDATED", () => {
  it("modelTrainingStatus refleja estado del modelo", () => {
    const pairs = makeRealDataset(40);
    const model = buildModelFromPairs(pairs);
    expect(model.validationStatus).toBe("validated");

    model.validationStatus = "trained";
    const validation = validateCalibrationModel({ model, pairs });
    expect(validation.modelTrainingStatus).toBe("trained");
    expect(validation.validationStatus).not.toBe("VALIDATED_EXPLORATORY");
  });
});
