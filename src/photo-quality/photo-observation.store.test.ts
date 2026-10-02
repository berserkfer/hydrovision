import { afterEach, describe, expect, it } from "vitest";
import { savePhotoObservation, listPhotoObservations, __resetPhotoObservationStoreForTests } from "./photo-observation.store";
import { __resetPhotoCalibrationStoreForTests, listPhotoCalibrationPairs } from "./photo-calibration.store";
import type { PhotoObservationInput } from "./photo-observation.types";

function buildInput(overrides: Partial<PhotoObservationInput> = {}): PhotoObservationInput {
  return {
    id: "obs-1",
    capturedAt: "2026-01-01T10:00:00-05:00",
    gps: { latitude: -6.87, longitude: -79.92 },
    connectivityAtCapture: "offline",
    hasReferencePanel: true,
    waterRgb: { r: 90, g: 100, b: 80 },
    skyRgb: { r: 150, g: 180, b: 220 },
    cardRgb: { r: 200, g: 200, b: 200 },
    rrs: { r: 0.02, g: 0.022, b: 0.018 },
    qualitativeColorIndex: null,
    turbidityNtu: 15.3,
    turbiditySaturated: false,
    confidenceLevel: "LEVEL_1",
    formulaSource: "hydrocolor_generic",
    confidenceLabel: "Estimación offline — genérica sin calibrar, sin verificación adicional.",
    satelliteReference: null,
    labSample: null,
    ...overrides,
  };
}

describe("savePhotoObservation — idempotente por id, nunca duplica", () => {
  afterEach(() => {
    __resetPhotoObservationStoreForTests();
    __resetPhotoCalibrationStoreForTests();
  });

  it("guarda una observación nueva", () => {
    const result = savePhotoObservation(buildInput());
    expect(result.created).toBe(true);
    expect(listPhotoObservations()).toHaveLength(1);
  });

  it("reenviar la MISMA observación (mismo id) — ej. reintento de sync — no la duplica", () => {
    savePhotoObservation(buildInput());
    const second = savePhotoObservation(buildInput());
    expect(second.created).toBe(false);
    expect(listPhotoObservations()).toHaveLength(1);
  });

  it("si trae labSample y hay Rrs (con cartulina), alimenta la base de calibración", () => {
    const result = savePhotoObservation(
      buildInput({
        labSample: { parameterCode: "turbidity", value: 18, labDate: "2026-01-01" },
      })
    );
    expect(result.calibrationPairAdded).toBe(true);
    expect(listPhotoCalibrationPairs("turbidity")).toHaveLength(1);
  });

  it("si trae labSample pero SIN cartulina (rrs=null), rechaza el par de calibración explícitamente", () => {
    const result = savePhotoObservation(
      buildInput({
        hasReferencePanel: false,
        cardRgb: null,
        rrs: null,
        labSample: { parameterCode: "turbidity", value: 18, labDate: "2026-01-01" },
      })
    );
    expect(result.calibrationPairAdded).toBe(false);
    expect(result.calibrationPairRejectedReason).toMatch(/sin cartulina/i);
    expect(listPhotoCalibrationPairs("turbidity")).toHaveLength(0);
  });
});
