/**
 * Tests — bloqueo duro de parámetros no ópticamente plausibles.
 * Regla: ningún volumen de datos habilita calibración/predicción para
 * ph, cod, bod5, nitrates, phosphates, coliforms.
 */

import { describe, expect, it } from "vitest";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";
import { evaluateParameterReadiness, isReadinessSufficientForCalibration } from "./calibration-readiness";
import {
  isOpticallyPlausibleTarget,
  NON_OPTICALLY_PLAUSIBLE_PARAMETERS,
  OPTICALLY_PLAUSIBLE_MODELING_TARGETS,
} from "@/satellite/config/optically-plausible-parameters.config";
import { evaluateNonlinearEligibility, NONLINEAR_MODELS_STATUS } from "./nonlinear-models.stub";

function makeAbundantPhosphatesPair(index: number): ScientificFieldSatellitePair {
  const month = String(Math.floor(index / 30) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  return {
    id: `pair-phos-${index}`,
    stationId: `est-real-${index % 5}`,
    fieldSampleId: `m-${index}`,
    fieldMeasurementId: `m-${index}::phosphates`,
    parameterCode: "phosphates",
    fieldValue: 0.1 + index * 0.01,
    fieldUnit: "mg/L",
    fieldDate: `2025-${month}-${day}T12:00:00.000Z`,
    satelliteObservationId: `sat-${index}`,
    satelliteSceneId: `S2A_${index}`,
    satelliteProvider: "planetary",
    satelliteAcquisitionDate: `2025-${month}-${day}`,
    spectralIndices: { ndvi: 0.1, ndci: 0.2, ndwi: 0.05, mndwi: null, ndti: null, ndmi: null },
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
  };
}

describe("optically-plausible-parameters.config", () => {
  it("bloquea exactamente ph, cod, bod5, nitrates, phosphates, coliforms, thermotolerant_coliforms", () => {
    expect([...NON_OPTICALLY_PLAUSIBLE_PARAMETERS].sort()).toEqual(
      ["bod5", "cod", "coliforms", "nitrates", "ph", "phosphates", "thermotolerant_coliforms"].sort()
    );
  });

  it("turbidity es ópticamente plausible y está habilitado como target de modelado", () => {
    expect(isOpticallyPlausibleTarget("turbidity")).toBe(true);
    expect(OPTICALLY_PLAUSIBLE_MODELING_TARGETS).toContain("turbidity");
  });

  it("phosphates NO es ópticamente plausible como target de modelo", () => {
    expect(isOpticallyPlausibleTarget("phosphates")).toBe(false);
  });
});

describe("calibration-readiness — bloqueo duro", () => {
  it("NUNCA entrena para phosphates aunque haya 200 pares reales 'perfectos'", () => {
    const abundantPairs = Array.from({ length: 200 }, (_, i) => makeAbundantPhosphatesPair(i));
    const readiness = evaluateParameterReadiness(abundantPairs, "phosphates", "NDCI");

    expect(readiness.status).toBe("NOT_OPTICALLY_PLAUSIBLE");
    expect(isReadinessSufficientForCalibration(readiness.status)).toBe(false);
  });

  it("bloquea también ph, cod, bod5, nitrates, coliforms sin evaluar cantidad de datos", () => {
    for (const parameterCode of NON_OPTICALLY_PLAUSIBLE_PARAMETERS) {
      const readiness = evaluateParameterReadiness([], parameterCode);
      expect(readiness.status).toBe("NOT_OPTICALLY_PLAUSIBLE");
    }
  });

  it("turbidity sigue evaluándose normalmente (sin bloqueo duro)", () => {
    const readiness = evaluateParameterReadiness([], "turbidity");
    expect(readiness.status).not.toBe("NOT_OPTICALLY_PLAUSIBLE");
  });
});

describe("nonlinear-models.stub", () => {
  it("permanece deshabilitado incluso cuando N cumple la regla 10x", () => {
    const result = evaluateNonlinearEligibility(200, 2); // requiere 20, sobra
    expect(NONLINEAR_MODELS_STATUS).toBe("disabled");
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("disabled");
    expect(result.message).toMatch(/NO están implementados/);
  });

  it("reporta insuficiencia clara cuando N no cumple la regla 10x", () => {
    const result = evaluateNonlinearEligibility(15, 2); // requiere 20
    expect(result.status).toBe("disabled");
    expect(result.requiredSamples).toBe(20);
    expect(result.message).toMatch(/Datos insuficientes/);
  });
});
