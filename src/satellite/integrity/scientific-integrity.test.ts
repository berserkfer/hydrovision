/**
 * Tests — correcciones de integridad científica (Prompt 10).
 * Deterministas, sin GEE live ni DB.
 */

import { describe, expect, it } from "vitest";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import {
  classifyParametros,
  parametrosToECAMeasurement,
} from "@/lib/sampling/sampling-utils";
import { classifyMeasurement } from "@/lib/eca/classifier";
import {
  buildSentinel2ReflectanceExpression,
} from "@/server/gee/gee-expression.builder";
import {
  processGeeSurfaceReflectances,
  parseCloudCoverFromMetadata,
} from "@/server/gee/gee-band.mapper";
import {
  buildSatelliteObservationFromGee,
  getSupportedIndexCodesForGee,
} from "@/server/satellite/satellite-observation.builder";
import { mapGeeReflectances } from "@/server/gee/gee-band.mapper";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";
import {
  computeDistanceMeters,
  matchFieldToSatellite,
  type MatchableFieldSample,
  type MatchableSatelliteObservation,
} from "@/satellite/matching/field-satellite-matching";
import {
  assertNoObservationIdLeakage,
  ObservationLeakageError,
  splitPairsByTemporalOrder,
} from "@/satellite/calibration/temporal-split";
import { evaluateScientificPairQuality } from "@/satellite/quality/scientific-pair-quality";
import type { Muestreo, Measurement, Parameter } from "@prisma/client";
import type { ScientificFieldSatellitePair } from "@/satellite/types/scientific-dataset.types";

const baseMuestreo: Muestreo = {
  id: "m1",
  campanaId: "c1",
  puntoMonitoreoId: "e1",
  codigoMuestra: "E01-20250101",
  fechaMuestreo: new Date("2025-01-01T10:00:00.000Z"),
  responsableId: "usr-investigador",
  clima: "Soleado",
  colorAparente: "Claro",
  estado: "registered",
  observaciones: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeParam(codigo: Parameter["codigo"], id: string): Parameter {
  return {
    id,
    codigo,
    nombre: codigo,
    unidad: "unit",
    categoryId: null,
    unitId: null,
    descripcion: null,
    estado: "active",
    observaciones: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("Hallazgo 1 — missing field ≠ zero", () => {
  it("medición ausente no se convierte en 0", () => {
    const result = aggregateMedicionesToParametros([baseMuestreo], []);
    expect(result[0].turbidez).toBeUndefined();
    expect(result[0].ph).toBeUndefined();
    expect(result[0]).not.toHaveProperty("turbidez", 0);
  });

  it("medición real igual a 0 se conserva", () => {
    const paramTurb: Parameter = makeParam("turbidity", "param-turb");
    const mediciones: Array<Measurement & { parametro: Parameter }> = [
      {
        id: "med-turb",
        muestreoId: "m1",
        campanaId: "c1",
        parametroId: "param-turb",
        puntoMonitoreoId: "e1",
        unitId: null,
        valor: 0,
        unidad: "NTU",
        cumplimientoEca: null,
        comentario: null,
        fechaMedicion: new Date(),
        metodoAnalisis: null,
        laboratorio: null,
        equipoUtilizado: null,
        nivelConfianza: null,
        responsableId: null,
        calidadDato: "valid",
        estado: "active",
        observaciones: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parametro: paramTurb,
      },
    ];
    const result = aggregateMedicionesToParametros([baseMuestreo], mediciones);
    expect(result[0].turbidez).toBe(0);
  });

  it("ECA no clasifica parámetro ausente", () => {
    const params = aggregateMedicionesToParametros([baseMuestreo], [])[0];
    const measurement = parametrosToECAMeasurement(params, "E01", "2025-01-01");
    expect(measurement.turbidity).toBeUndefined();
    const compliance = classifyMeasurement(measurement);
    expect(compliance.violatedParameters).not.toContain("turbidity");
    expect(compliance.alertParameters).not.toContain("turbidity");
  });

  it("múltiples parámetros parcialmente ausentes", () => {
    const paramPh = makeParam("ph", "param-ph");
    const mediciones: Array<Measurement & { parametro: Parameter }> = [
      {
        id: "med-ph",
        muestreoId: "m1",
        campanaId: "c1",
        parametroId: "param-ph",
        puntoMonitoreoId: "e1",
        unitId: null,
        valor: 7.1,
        unidad: "UPH",
        cumplimientoEca: null,
        comentario: null,
        fechaMedicion: new Date(),
        metodoAnalisis: null,
        laboratorio: null,
        equipoUtilizado: null,
        nivelConfianza: null,
        responsableId: null,
        calidadDato: "valid",
        estado: "active",
        observaciones: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parametro: paramPh,
      },
    ];
    const params = aggregateMedicionesToParametros([baseMuestreo], mediciones)[0];
    expect(params.ph).toBe(7.1);
    expect(params.turbidez).toBeUndefined();
    expect(params.conductividad).toBeUndefined();
  });
});

describe("Hallazgo 2 — isSimulated propagado", () => {
  it("DATABASE → isSimulated false en ECA", () => {
    const params = {
      ...aggregateMedicionesToParametros([baseMuestreo], [])[0],
      ph: 7.0,
    };
    const eca = parametrosToECAMeasurement(params, "E01", "2025-01-01");
    expect(eca.isSimulated).toBe(false);
  });

  it("mock → isSimulated true en ECA", () => {
    const params = {
      ...aggregateMedicionesToParametros([baseMuestreo], [])[0],
      ph: 7.0,
      isSimulated: true as const,
    };
    const eca = parametrosToECAMeasurement(params, "E01", "2025-01-01");
    expect(eca.isSimulated).toBe(true);
  });

  it("classifyParametros respeta origen simulado", () => {
    const dbParams = {
      ...aggregateMedicionesToParametros([baseMuestreo], [])[0],
      ph: 7.0,
    };
    const simParams = { ...dbParams, isSimulated: true as const };
    expect(classifyParametros(dbParams, "E01", "2025-01-01").status).toBeDefined();
    expect(classifyParametros(simParams, "E01", "2025-01-01").status).toBeDefined();
    expect(parametrosToECAMeasurement(simParams, "E01", "2025-01-01").isSimulated).toBe(true);
  });
});

describe("Hallazgo 3 — reflectancia GEE semántica", () => {
  it("reflectancias válidas en rango 0–1", () => {
    const result = processGeeSurfaceReflectances({ B2: 0.05, B8: 0.25 });
    expect(result.semanticStatus).toBe("valid");
    expect(result.reflectances.B02).toBe(0.05);
    expect(result.reflectances.B08).toBe(0.25);
  });

  it("valores fuera de rango → out_of_range", () => {
    const scaled = processGeeSurfaceReflectances({ B2: 500, B8: 1200 });
    expect(scaled.semanticStatus).toBe("out_of_range");
    expect(Object.keys(scaled.reflectances)).toHaveLength(0);
  });

  it("valores negativos → out_of_range", () => {
    const neg = processGeeSurfaceReflectances({ B2: -0.01 });
    expect(neg.semanticStatus).toBe("out_of_range");
  });

  it("missing → missing", () => {
    const empty = processGeeSurfaceReflectances({});
    expect(empty.semanticStatus).toBe("missing");
  });

  it("reflectancia out_of_range no alimenta índices en builder", () => {
    const outOfRange = processGeeSurfaceReflectances({ B2: 5000, B8: 8000 });
    expect(outOfRange.semanticStatus).toBe("out_of_range");
    expect(Object.keys(outOfRange.reflectances)).toHaveLength(0);
    const ndvi = computeSpectralIndex("NDVI", outOfRange.reflectances);
    expect(ndvi).toBeNull();
  });
});

describe("Hallazgo 4 — cloudPercentage no hardcodeado a 0", () => {
  it("parseCloudCoverFromMetadata devuelve null sin metadata", () => {
    expect(parseCloudCoverFromMetadata(null)).toBeNull();
    expect(parseCloudCoverFromMetadata({})).toBeNull();
  });

  it("parseCloudCoverFromMetadata extrae valor real", () => {
    expect(parseCloudCoverFromMetadata({ CLOUDY_PIXEL_PERCENTAGE: 18.5 })).toBe(18.5);
  });
});

describe("Hallazgo 5 — sceneId en expresión de reflectancia", () => {
  it("filtra system:index cuando sceneId está presente", () => {
    const expr = buildSentinel2ReflectanceExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
      sceneId: "20250115T152019_T18LTJ_20250115T152019",
    });
    expect(expr).toContain("system:index");
    expect(expr).toContain("20250115T152019_T18LTJ_20250115T152019");
    expect(expr).toContain(".first()");
  });

  it("sin sceneId no añade filtro de escena", () => {
    const expr = buildSentinel2ReflectanceExpression({
      latitude: -6.75,
      longitude: -79.85,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    });
    expect(expr).not.toContain("system:index");
  });
});

describe("Hallazgo 6 — NDMI en flujo oficial", () => {
  it("NDMI está en índices soportados por GEE builder", () => {
    expect(getSupportedIndexCodesForGee()).toContain("NDMI");
  });

  it("calcula NDMI desde reflectancias B08 y B11", () => {
    const reflectances = mapGeeReflectances({ B8: 0.35, B11: 0.04 });
    const obs = buildSatelliteObservationFromGee({
      stationId: "est-e01",
      isSimulated: true,
      scene: {
        sceneId: "S2A_ndmi",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        tileId: "T18LTJ",
        collection: "COPERNICUS/S2_SR_HARMONIZED",
        platform: "sentinel2",
      },
      reflectance: {
        sceneId: "S2A_ndmi",
        acquisitionDate: "2025-06-01",
        cloudPercentage: 10,
        rawBandValues: { B8: 0.35, B11: 0.04 },
        reflectances,
        bandsUsed: ["B08", "B11"],
        reflectanceSemanticStatus: "valid",
      },
    });
    expect(obs.indices.NDMI).toBe(computeSpectralIndex("NDMI", reflectances));
    expect(obs.indices.NDMI).not.toBeNull();
  });
});

describe("Hallazgo 7 — coordenadas faltantes", () => {
  const fieldWithCoords: MatchableFieldSample = {
    sampleId: "m-1",
    stationId: "est-e01",
    date: "2025-06-15",
    latitude: -6.75,
    longitude: -79.85,
  };

  const satelliteWithCoords: MatchableSatelliteObservation = {
    observationId: "sat-1",
    sceneId: "S2A_20250614",
    stationId: "est-e01",
    acquisitionDate: "2025-06-14",
    latitude: -6.75,
    longitude: -79.85,
    isSimulated: true,
  };

  it("missing field coordinates → distance null", () => {
    const fieldNoCoords = { ...fieldWithCoords, latitude: undefined, longitude: undefined };
    expect(computeDistanceMeters(fieldNoCoords, satelliteWithCoords)).toBeNull();
  });

  it("missing satellite coordinates → distance null", () => {
    const satNoCoords = { ...satelliteWithCoords, latitude: undefined, longitude: undefined };
    expect(computeDistanceMeters(fieldWithCoords, satNoCoords)).toBeNull();
  });

  it("coordenadas inválidas → distance null", () => {
    const fieldInvalid = { ...fieldWithCoords, latitude: NaN };
    expect(computeDistanceMeters(fieldInvalid, satelliteWithCoords)).toBeNull();
  });

  it("coordenadas válidas → Haversine normal", () => {
    expect(computeDistanceMeters(fieldWithCoords, satelliteWithCoords)).toBe(0);
  });

  it("matching insufficient_data sin coordenadas de campo", () => {
    const fieldNoCoords = { ...fieldWithCoords, latitude: undefined, longitude: undefined };
    const match = matchFieldToSatellite(fieldNoCoords, [satelliteWithCoords], true);
    expect(match.distanceMeters).toBeNull();
    expect(match.matchingStatus).toBe("insufficient_data");
    expect(match.operationallyCompatible).toBe(false);
  });
});

describe("Hallazgo 8 — leakage por observación satelital", () => {
  function makePair(
    index: number,
    obsId: string
  ): ScientificFieldSatellitePair {
    const month = String(Math.floor(index / 30) + 1).padStart(2, "0");
    const day = String((index % 28) + 1).padStart(2, "0");
    return {
      id: `pair-${index}`,
      stationId: "est-e01",
      fieldSampleId: `m-${index}`,
      fieldMeasurementId: `m-${index}::turbidity`,
      parameterCode: "turbidity",
      fieldValue: 10 + index,
      fieldUnit: "NTU",
      fieldDate: `2025-${month}-${day}T12:00:00.000Z`,
      satelliteObservationId: obsId,
      satelliteSceneId: `S2A_${index}`,
      satelliteAcquisitionDate: `2025-${month}-${day}`,
      spectralIndices: { ndti: 0.1, ndvi: null, ndci: null, ndwi: null, mndwi: null, ndmi: null },
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

  it("detecta misma satelliteObservationId en training y validation", () => {
    const pairs = Array.from({ length: 80 }, (_, i) =>
      makePair(i, i === 5 || i === 65 ? "sat-shared" : `sat-${i}`)
    );
    expect(() => splitPairsByTemporalOrder(pairs)).toThrow(ObservationLeakageError);
  });

  it("assertNoObservationIdLeakage lanza con IDs compartidos", () => {
    const training = [makePair(0, "sat-leak")];
    const validation = [makePair(50, "sat-leak")];
    expect(() => assertNoObservationIdLeakage(training, validation)).toThrow(
      ObservationLeakageError
    );
  });
});

describe("Hallazgo 9 — cloud unknown en QC", () => {
  it("cloudPercentage null → insufficient_data, no accepted", () => {
    const result = evaluateScientificPairQuality({
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
      cloudPercentage: null,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      spectralIndices: {
        ndvi: 0.2,
        ndci: null,
        ndwi: null,
        mndwi: null,
        ndti: 0.08,
        ndmi: null,
      },
    });
    expect(result.qualityStatus).toBe("insufficient_data");
    expect(result.rejectionReason).toMatch(/nubosa desconocida/i);
  });

  it("cloudPercentage conocido permite accepted", () => {
    const result = evaluateScientificPairQuality({
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
      cloudPercentage: 8,
      reflectanceSemanticStatus: "valid",
      pixelQualityStatus: "water",
      spectralIndices: {
        ndvi: 0.2,
        ndci: null,
        ndwi: null,
        mndwi: null,
        ndti: 0.08,
        ndmi: null,
      },
    });
    expect(result.qualityStatus).toBe("accepted");
  });
});
