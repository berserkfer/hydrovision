import { afterEach, describe, expect, it } from "vitest";
import { addPhotoCalibrationPair, __resetPhotoCalibrationStoreForTests } from "./photo-calibration.store";
import { evaluatePhotoCalibration, predictWithPhotoCalibration } from "./photo-calibration.service";
import { MIN_TREND_DISTINCT_DATES, MIN_TREND_POINTS } from "@/satellite/config/field-trend.config";

describe("evaluatePhotoCalibration — reutiliza el mínimo ya definido en la plataforma (4 pts / 3 fechas)", () => {
  afterEach(() => __resetPhotoCalibrationStoreForTests());

  it("con 0 pares reporta insuficiente sin fabricar nada", () => {
    const status = evaluatePhotoCalibration("turbidity");
    expect(status.sufficient).toBe(false);
    expect(status.model).toBeNull();
    expect(status.n).toBe(0);
    expect(status.minPointsRequired).toBe(MIN_TREND_POINTS);
    expect(status.minDistinctDatesRequired).toBe(MIN_TREND_DISTINCT_DATES);
  });

  it("con 4 pares pero solo 2 fechas distintas, sigue insuficiente (repite el criterio del módulo de tendencia)", () => {
    for (let i = 0; i < 4; i += 1) {
      addPhotoCalibrationPair({
        id: `p${i}`,
        parameterCode: "turbidity",
        capturedAt: "2024-01-01",
        rrsRed: 0.01 + i * 0.002,
        labValue: 10 + i,
        labDate: i < 2 ? "2024-01-01" : "2024-02-01", // solo 2 fechas distintas
        source: "lab_manual",
      });
    }
    const status = evaluatePhotoCalibration("turbidity");
    expect(status.n).toBe(4);
    expect(status.distinctDates).toBe(2);
    expect(status.sufficient).toBe(false);
  });

  it("con 4 pares y 3+ fechas distintas, calibra y reporta R²/RMSE/MAE reales", () => {
    const samples = [
      { rrsRed: 0.01, labValue: 10, labDate: "2024-01-01" },
      { rrsRed: 0.015, labValue: 15, labDate: "2024-02-01" },
      { rrsRed: 0.02, labValue: 20, labDate: "2024-03-01" },
      { rrsRed: 0.025, labValue: 25, labDate: "2024-04-01" },
    ];
    samples.forEach((s, i) =>
      addPhotoCalibrationPair({
        id: `p${i}`,
        parameterCode: "turbidity",
        capturedAt: s.labDate,
        rrsRed: s.rrsRed,
        labValue: s.labValue,
        labDate: s.labDate,
        source: "lab_manual",
      })
    );

    const status = evaluatePhotoCalibration("turbidity");
    expect(status.sufficient).toBe(true);
    expect(status.n).toBe(4);
    expect(status.distinctDates).toBe(4);
    expect(status.model).not.toBeNull();
    // Relación perfectamente lineal (labValue = 1000*rrsRed) → R² debe ser ~1
    expect(status.model?.metrics.r2).toBeCloseTo(1, 3);
    expect(status.validRange).toEqual({ min: 0.01, max: 0.025 });
  });

  it("matrices/parámetros distintos nunca se mezclan (turbidity vs total_suspended_solids)", () => {
    addPhotoCalibrationPair({
      id: "t1",
      parameterCode: "turbidity",
      capturedAt: "2024-01-01",
      rrsRed: 0.01,
      labValue: 5,
      labDate: "2024-01-01",
      source: "lab_manual",
    });
    const sstStatus = evaluatePhotoCalibration("total_suspended_solids");
    expect(sstStatus.n).toBe(0);
  });
});

describe("predictWithPhotoCalibration", () => {
  afterEach(() => __resetPhotoCalibrationStoreForTests());

  it("retorna null si no hay calibración suficiente — nunca fabrica un valor 'calibrado'", () => {
    expect(predictWithPhotoCalibration("turbidity", 0.02)).toBeNull();
  });

  it("con calibración suficiente, predice y marca fuera-de-rango cuando corresponde", () => {
    const samples = [
      { rrsRed: 0.01, labValue: 10, labDate: "2024-01-01" },
      { rrsRed: 0.015, labValue: 15, labDate: "2024-02-01" },
      { rrsRed: 0.02, labValue: 20, labDate: "2024-03-01" },
      { rrsRed: 0.025, labValue: 25, labDate: "2024-04-01" },
    ];
    samples.forEach((s, i) =>
      addPhotoCalibrationPair({
        id: `p${i}`,
        parameterCode: "turbidity",
        capturedAt: s.labDate,
        rrsRed: s.rrsRed,
        labValue: s.labValue,
        labDate: s.labDate,
        source: "lab_manual",
      })
    );

    const inRange = predictWithPhotoCalibration("turbidity", 0.02);
    expect(inRange?.outOfRange).toBe(false);
    expect(inRange?.value).toBeCloseTo(20, 0);

    const outOfRange = predictWithPhotoCalibration("turbidity", 0.05);
    expect(outOfRange?.outOfRange).toBe(true);
  });
});
