/**
 * Tests — control de calidad científico para pares campo ↔ satélite.
 * Deterministas, sin GEE ni DB.
 */

import { describe, expect, it } from "vitest";
import {
  evaluateScientificPairQuality,
  mapIndicesToSnapshot,
} from "@/satellite/quality/scientific-pair-quality";
import type { QualityEvaluationInput } from "@/satellite/quality/scientific-pair-quality";

function baseInput(overrides: Partial<QualityEvaluationInput> = {}): QualityEvaluationInput {
  return {
    stationId: "est-e01",
    fieldSampleId: "m-001",
    parameterCode: "turbidity",
    fieldValue: 12.5,
    fieldUnit: "NTU",
    fieldDate: "2025-06-15",
    fieldIsSimulated: false,
    satelliteObservationId: "sat-001",
    satelliteIsSimulated: false,
    matchingStatus: "matched",
    operationallyCompatible: true,
    temporalDifferenceDays: 1,
    distanceMeters: 45,
    spectralIndices: {
      ndvi: 0.2,
      ndci: null,
      ndwi: 0.15,
      mndwi: null,
      ndti: 0.08,
      ndmi: null,
    },
    cloudPercentage: 5,
    reflectanceSemanticStatus: "valid",
    pixelQualityStatus: "valid",
    spatialRepresentativeness: "point_sampling",
    ...overrides,
  };
}

describe("evaluateScientificPairQuality", () => {
  it("1. acepta par válido real", () => {
    const result = evaluateScientificPairQuality(baseInput());
    expect(result.qualityStatus).toBe("accepted");
    expect(result.isSimulated).toBe(false);
    expect(result.rejectionReason).toBeUndefined();
  });

  it("2. marca par simulado como simulated_data sin eliminarlo", () => {
    const fieldSim = evaluateScientificPairQuality(baseInput({ fieldIsSimulated: true }));
    expect(fieldSim.qualityStatus).toBe("simulated_data");
    expect(fieldSim.isSimulated).toBe(true);

    const satSim = evaluateScientificPairQuality(baseInput({ satelliteIsSimulated: true }));
    expect(satSim.qualityStatus).toBe("simulated_data");
    expect(satSim.isSimulated).toBe(true);
  });

  it("3. detecta falta de índice espectral", () => {
    const result = evaluateScientificPairQuality(
      baseInput({
        spectralIndices: {
          ndvi: null,
          ndci: null,
          ndwi: null,
          mndwi: null,
          ndti: null,
          ndmi: null,
        },
      })
    );
    expect(result.qualityStatus).toBe("missing_index");
    expect(result.rejectionReason).toMatch(/null/i);
  });

  it("4. detecta falta de medición (valor null)", () => {
    const result = evaluateScientificPairQuality(baseInput({ fieldValue: null }));
    expect(result.qualityStatus).toBe("invalid_measurement");
    expect(result.rejectionReason).toMatch(/no numérico|ausente/i);
  });

  it("5. detecta mismatch temporal", () => {
    const result = evaluateScientificPairQuality(
      baseInput({
        matchingStatus: "temporal_mismatch",
        operationallyCompatible: false,
        temporalDifferenceDays: 10,
      })
    );
    expect(result.qualityStatus).toBe("temporal_mismatch");
    expect(result.rejectionReason).toMatch(/10/);
  });

  it("6. detecta mismatch espacial", () => {
    const result = evaluateScientificPairQuality(
      baseInput({
        matchingStatus: "spatial_mismatch",
        operationallyCompatible: false,
        distanceMeters: 750,
      })
    );
    expect(result.qualityStatus).toBe("spatial_mismatch");
    expect(result.rejectionReason).toMatch(/750/);
  });

  it("7. rechaza parámetro desconocido", () => {
    const result = evaluateScientificPairQuality(
      baseInput({ parameterCode: "unknown_param" as "turbidity" })
    );
    expect(result.qualityStatus).toBe("invalid_measurement");
    expect(result.rejectionReason).toMatch(/desconocido/i);
  });

  it("8. rechaza valor no numérico (NaN)", () => {
    const result = evaluateScientificPairQuality(baseInput({ fieldValue: NaN }));
    expect(result.qualityStatus).toBe("invalid_measurement");
  });

  it("9. no confunde null con 0 en índices", () => {
    const snapshot = mapIndicesToSnapshot({ NDVI: 0, NDTI: undefined });
    expect(snapshot.ndvi).toBe(0);
    expect(snapshot.ndti).toBeNull();
    expect(snapshot.ndti).not.toBe(0);

    const withZero = evaluateScientificPairQuality(
      baseInput({
        spectralIndices: {
          ndvi: 0,
          ndci: null,
          ndwi: null,
          mndwi: null,
          ndti: null,
          ndmi: null,
        },
      })
    );
    expect(withZero.qualityStatus).toBe("accepted");
  });

  it("matchingStatus y qualityStatus permanecen separados", () => {
    const result = evaluateScientificPairQuality(
      baseInput({
        matchingStatus: "matched",
        operationallyCompatible: true,
      })
    );
    expect(result.qualityStatus).toBe("accepted");
  });
});

describe("mapIndicesToSnapshot", () => {
  it("preserva null para índices ausentes", () => {
    const snapshot = mapIndicesToSnapshot({});
    expect(snapshot.ndvi).toBeNull();
    expect(snapshot.ndci).toBeNull();
  });
});
