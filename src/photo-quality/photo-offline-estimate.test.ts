import { describe, expect, it } from "vitest";
import { computeOfflinePhotoEstimate } from "./photo-offline-estimate";
import type { CachedLocalCalibration } from "./local-calibration-cache";

const WATER = { r: 90, g: 100, b: 80 };
const SKY = { r: 150, g: 180, b: 220 };
const CARD = { r: 200, g: 200, b: 200 };

describe("computeOfflinePhotoEstimate — el núcleo del Nivel 1, 100% sin red", () => {
  it("offline, sin calibración cacheada, con cartulina → usa la fórmula genérica de HydroColor", () => {
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: false,
      cachedCalibration: null,
    });

    expect(result.confidence.level).toBe("LEVEL_1");
    expect(result.confidence.formulaSource).toBe("hydrocolor_generic");
    expect(result.turbiditySource).toBe("hydrocolor_generic");
    expect(result.rrs).not.toBeNull();
    expect(result.qualitativeColorIndex).toBeNull();
  });

  it("offline, SIN cartulina → nunca fabrica NTU, solo un índice cualitativo", () => {
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: null,
      hasReferencePanel: false,
      isOnline: false,
      cachedCalibration: null,
    });

    expect(result.turbidityNtu).toBeNull();
    expect(result.rrs).toBeNull();
    expect(result.qualitativeColorIndex).toBe(Number((WATER.r / WATER.g).toFixed(4)));
  });

  it("offline CON calibración cacheada → usa la fórmula calibrada, no la genérica", () => {
    const cached: CachedLocalCalibration = {
      parameterCode: "turbidity",
      coefficientA: 0,
      coefficientB: 1000, // turbidity = 1000 * rrsRed, para verificar fácilmente
      validRange: { min: 0.001, max: 0.03 },
      n: 5,
      r2: 0.9,
      cachedAt: "2026-01-01T00:00:00-05:00",
    };

    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: false,
      cachedCalibration: cached,
    });

    expect(result.confidence.formulaSource).toBe("local_lab_calibration");
    expect(result.turbiditySource).toBe("local_lab_calibration");
    expect(result.rrs?.r).not.toBeNull();
    // turbidez esperada = 1000 * rrs.r (calibración lineal simple con a=0,b=1000)
    expect(result.turbidityNtu).toBeCloseTo(1000 * (result.rrs!.r as number), 1);
  });

  it("en línea, sin calibración confirmada por servidor ni escena satelital → se queda en Nivel 1", () => {
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: true,
      cachedCalibration: null,
      labCalibrationSufficientNow: false,
      satelliteSceneFound: false,
    });
    expect(result.confidence.level).toBe("LEVEL_1");
    expect(result.confidence.connectivityAtEvaluation).toBe("online");
  });

  it("en línea con escena satelital encontrada → Nivel 2", () => {
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: true,
      cachedCalibration: null,
      labCalibrationSufficientNow: false,
      satelliteSceneFound: true,
    });
    expect(result.confidence.level).toBe("LEVEL_2");
  });

  it("en línea con calibración confirmada por el servidor → Nivel 3, usa la fórmula calibrada", () => {
    const cached: CachedLocalCalibration = {
      parameterCode: "turbidity",
      coefficientA: 0,
      coefficientB: 500,
      validRange: { min: 0.001, max: 0.03 },
      n: 6,
      r2: 0.85,
      cachedAt: "2026-01-01T00:00:00-05:00",
    };
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: true,
      cachedCalibration: cached,
      labCalibrationSufficientNow: true,
      satelliteSceneFound: true, // aunque también haya escena, Nivel 3 gana
    });
    expect(result.confidence.level).toBe("LEVEL_3");
    expect(result.turbiditySource).toBe("local_lab_calibration");
  });

  it("marca fuera-de-rango cuando el Rrs cae fuera del rango calibrado", () => {
    const cached: CachedLocalCalibration = {
      parameterCode: "turbidity",
      coefficientA: 0,
      coefficientB: 1000,
      validRange: { min: 0.05, max: 0.06 }, // rango muy alto, a propósito
      n: 4,
      r2: 0.9,
      cachedAt: "2026-01-01T00:00:00-05:00",
    };
    const result = computeOfflinePhotoEstimate({
      waterRgb: WATER,
      skyRgb: SKY,
      cardRgb: CARD,
      hasReferencePanel: true,
      isOnline: false,
      cachedCalibration: cached,
    });
    expect(result.outOfCalibratedRange).toBe(true);
  });
});
