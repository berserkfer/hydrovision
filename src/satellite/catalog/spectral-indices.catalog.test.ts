/**
 * Tests — índices espectrales y fórmulas
 */

import { describe, expect, it } from "vitest";
import {
  SPECTRAL_INDEX_CODES,
  SPECTRAL_INDEX_DEFINITIONS,
  computeSpectralIndex,
  getSpectralIndexDefinition,
} from "@/satellite/catalog/spectral-indices.catalog";

const SAMPLE_REFLECTANCE = {
  B03: 0.12,
  B04: 0.08,
  B05: 0.1,
  B08: 0.35,
  B11: 0.1,
} as const;

describe("spectral indices catalog", () => {
  it("incluye NDVI, NDCI, NDWI, MNDWI como mínimo", () => {
    expect(SPECTRAL_INDEX_CODES).toEqual(
      expect.arrayContaining(["NDVI", "NDCI", "NDWI", "MNDWI"])
    );
  });

  it("documenta fórmula y bandas por índice", () => {
    for (const code of SPECTRAL_INDEX_CODES) {
      const def = getSpectralIndexDefinition(code);
      expect(def.formula.length).toBeGreaterThan(5);
      expect(def.bands.length).toBeGreaterThanOrEqual(2);
      expect(def.formulaExpression).toMatch(/B\d/);
    }
  });

  it("NDCI usa bandas red edge y red", () => {
    expect(SPECTRAL_INDEX_DEFINITIONS.NDCI.bands).toEqual(["B05", "B04"]);
    expect(SPECTRAL_INDEX_DEFINITIONS.NDCI.waterApplicable).toBe(true);
  });

  it("computeSpectralIndex retorna null si faltan bandas", () => {
    expect(computeSpectralIndex("NDVI", { B04: 0.1 })).toBeNull();
  });

  it("computeSpectralIndex calcula NDVI determinísticamente", () => {
    const value = computeSpectralIndex("NDVI", { ...SAMPLE_REFLECTANCE });
    expect(value).not.toBeNull();
    expect(value!).toBeCloseTo((0.35 - 0.08) / (0.35 + 0.08), 5);
  });

  it("computeSpectralIndex calcula NDCI determinísticamente", () => {
    const value = computeSpectralIndex("NDCI", { ...SAMPLE_REFLECTANCE });
    expect(value).not.toBeNull();
    expect(value!).toBeCloseTo((0.1 - 0.08) / (0.1 + 0.08), 5);
  });

  it("computeSpectralIndex calcula NDWI y MNDWI", () => {
    expect(computeSpectralIndex("NDWI", { ...SAMPLE_REFLECTANCE })).toBeCloseTo(
      (0.12 - 0.35) / (0.12 + 0.35),
      5
    );
    expect(computeSpectralIndex("MNDWI", { ...SAMPLE_REFLECTANCE })).toBeCloseTo(
      (0.12 - 0.1) / (0.12 + 0.1),
      5
    );
  });
});
