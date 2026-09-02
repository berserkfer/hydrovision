/**
 * Tests — matching operativo campo ↔ satélite (deterministas, sin GEE).
 */

import { describe, expect, it } from "vitest";
import {
  daysBetweenDates,
  findNearestSatelliteObservation,
  haversineDistanceMeters,
  isSpatiallyCompatible,
  isTemporallyCompatible,
  matchAllFieldToSatellite,
  matchFieldToSatellite,
  type MatchableFieldSample,
  type MatchableSatelliteObservation,
} from "@/satellite/matching/field-satellite-matching";
import { MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS } from "@/satellite/config/matching.config";
import { getCandidateRelationshipsForParameter } from "@/satellite/catalog/comparability.catalog";
import { CANDIDATE_RELATIONSHIPS } from "@/satellite/catalog/comparability.catalog";

const fieldSample: MatchableFieldSample = {
  sampleId: "m-1",
  stationId: "est-e01",
  date: "2025-06-15",
  latitude: -6.75,
  longitude: -79.85,
};

const satelliteObs: MatchableSatelliteObservation[] = [
  {
    observationId: "sat-1",
    sceneId: "S2A_20250614",
    stationId: "est-e01",
    acquisitionDate: "2025-06-14",
    latitude: -6.75,
    longitude: -79.85,
    isSimulated: true,
  },
  {
    observationId: "sat-2",
    sceneId: "S2A_20250620",
    stationId: "est-e01",
    acquisitionDate: "2025-06-20",
    latitude: -6.75,
    longitude: -79.85,
    isSimulated: true,
  },
];

describe("daysBetweenDates", () => {
  it("calcula diferencia absoluta en días", () => {
    expect(daysBetweenDates("2025-06-15", "2025-06-14")).toBe(1);
    expect(daysBetweenDates("2025-06-15", "2025-06-20")).toBe(5);
  });
});

describe("isTemporallyCompatible", () => {
  it("acepta diferencia dentro del umbral operativo", () => {
    expect(isTemporallyCompatible(MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS)).toBe(true);
    expect(isTemporallyCompatible(MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS + 1)).toBe(false);
  });
});

describe("isSpatiallyCompatible", () => {
  it("acepta distancia nula (misma estación)", () => {
    expect(isSpatiallyCompatible(0)).toBe(true);
  });

  it("rechaza distancia mayor al umbral", () => {
    expect(isSpatiallyCompatible(600)).toBe(false);
  });

  it("rechaza null como incompatible (coordenadas desconocidas)", () => {
    expect(isSpatiallyCompatible(null)).toBe(false);
  });
});

describe("findNearestSatelliteObservation", () => {
  it("elige la escena más cercana en tiempo", () => {
    const nearest = findNearestSatelliteObservation(fieldSample, satelliteObs);
    expect(nearest?.observationId).toBe("sat-1");
  });
});

describe("matchFieldToSatellite", () => {
  it("matched cuando diferencia temporal es 1 día", () => {
    const match = matchFieldToSatellite(fieldSample, satelliteObs, true);
    expect(match.matchingStatus).toBe("matched");
    expect(match.temporalDifferenceDays).toBe(1);
    expect(match.sourceTypeField).toBe("field");
    expect(match.sourceTypeSatellite).toBe("satellite");
    expect(match.operationallyCompatible).toBe(true);
    expect(match.isSimulated).toBe(true);
  });

  it("temporal_mismatch cuando diferencia excede umbral", () => {
    const farObs: MatchableSatelliteObservation[] = [
      {
        ...satelliteObs[1],
        acquisitionDate: "2025-07-01",
      },
    ];
    const match = matchFieldToSatellite(fieldSample, farObs, true);
    expect(match.matchingStatus).toBe("temporal_mismatch");
    expect(match.operationallyCompatible).toBe(false);
  });

  it("missing_satellite sin observaciones", () => {
    const match = matchFieldToSatellite(fieldSample, [], true);
    expect(match.matchingStatus).toBe("missing_satellite");
    expect(match.satelliteObservationId).toBeNull();
  });

  it("spatial_mismatch con distancia excesiva", () => {
    const farSpatial: MatchableSatelliteObservation[] = [
      {
        ...satelliteObs[0],
        latitude: -7.5,
        longitude: -80.5,
      },
    ];
    const match = matchFieldToSatellite(fieldSample, farSpatial, true);
    expect(match.matchingStatus).toBe("spatial_mismatch");
  });
});

describe("matchAllFieldToSatellite", () => {
  it("genera un match por muestra de campo", () => {
    const samples: MatchableFieldSample[] = [
      fieldSample,
      { ...fieldSample, sampleId: "m-2", date: "2025-06-20" },
    ];
    const matches = matchAllFieldToSatellite(samples, satelliteObs, true);
    expect(matches).toHaveLength(2);
  });
});

describe("haversineDistanceMeters", () => {
  it("distancia cero para mismas coordenadas", () => {
    expect(haversineDistanceMeters(-6.75, -79.85, -6.75, -79.85)).toBe(0);
  });
});

describe("comparability catalog", () => {
  it("declara candidate_relationship — no equivalencia", () => {
    for (const rel of CANDIDATE_RELATIONSHIPS) {
      expect(rel.relationshipKind).toBe("candidate_relationship");
      expect(rel.disclaimer.toLowerCase()).not.toMatch(/equivale|igual a|correlación/);
    }
  });

  it("turbidez tiene NDTI como índice candidato — no como medida directa", () => {
    const rels = getCandidateRelationshipsForParameter("turbidity");
    expect(rels.some((r) => r.potentialExplanatoryIndices.includes("NDTI"))).toBe(true);
    expect(rels[0].disclaimer).toMatch(/No implica/);
  });

  it("no declara NDCI = clorofila", () => {
    const allText = CANDIDATE_RELATIONSHIPS.map((r) => r.disclaimer).join(" ");
    expect(allText).not.toMatch(/NDCI\s*=\s*clorofila/i);
    expect(allText).not.toMatch(/NDTI\s*=\s*turbidez/i);
  });
});

describe("separación sourceType", () => {
  it("match mantiene field y satellite separados", () => {
    const match = matchFieldToSatellite(fieldSample, satelliteObs, false);
    expect(match.sourceTypeField).toBe("field");
    expect(match.sourceTypeSatellite).toBe("satellite");
    expect(match.sourceTypeField).not.toBe("model");
  });
});

describe("valores faltantes", () => {
  it("insufficient_data cuando no hay satélite ni temporal diff", () => {
    const match = matchFieldToSatellite(fieldSample, [], true);
    expect(match.temporalDifferenceDays).toBeNull();
    expect(match.matchingStatus).toBe("missing_satellite");
  });
});

describe("FieldSatelliteValidationService (mock path)", () => {
  it("devuelve comparaciones descriptivas sin correlación", async () => {
    const { fieldSatelliteValidationService } = await import(
      "@/server/satellite/validation/field-satellite-validation.service"
    );
    const { setDataProvider, resetDataProvider } = await import("@/data/store-access");
    const { mockDataProvider } = await import("@/providers/mock-data.provider");

    resetDataProvider();
    setDataProvider(mockDataProvider);

    const result = await fieldSatelliteValidationService.validate({
      stationId: "est-e01",
      fechaInicio: "2025-01-01",
      fechaFin: "2025-12-31",
      parameterCode: "turbidity",
    });

    expect(result.meta.scientificStatus).toBe("descriptive_only");
    expect(result.meta.isSimulated).toBe(true);
    expect(result.meta.disclaimers.join(" ")).toMatch(/No establece equivalencia/i);

    for (const comparison of result.comparisons) {
      expect(comparison.scientificStatus).not.toBe("predictive");
      expect(comparison.field.sourceType).toBe("field");
      expect(comparison.satellite.sourceType).toBe("satellite");
      expect(comparison.disclaimers.length).toBeGreaterThan(0);
      for (const rel of comparison.candidateRelationships) {
        expect(rel.relationshipKind).toBe("candidate_relationship");
      }
    }

    resetDataProvider();
  }, 15_000);
});
