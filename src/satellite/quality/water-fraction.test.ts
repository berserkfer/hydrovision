import { describe, expect, it } from "vitest";
import {
  MIN_WATER_PIXELS,
  WATER_FRACTION_THRESHOLD,
  assessWaterSufficiency,
  computeNdwi,
  computeWaterFraction,
} from "@/satellite/quality/water-fraction";

describe("computeNdwi", () => {
  it("calcula el NDWI con bandas verde y NIR", () => {
    expect(computeNdwi(0.2, 0.1)).toBeCloseTo(0.3333, 3);
  });

  it("devuelve null si falta una banda o el denominador es cero", () => {
    expect(computeNdwi(null, 0.1)).toBeNull();
    expect(computeNdwi(0.1, undefined)).toBeNull();
    expect(computeNdwi(0, 0)).toBeNull();
  });

  it("valores negativos indican ausencia de agua", () => {
    expect(computeNdwi(0.1, 0.3)).toBeLessThan(0);
  });
});

describe("computeWaterFraction", () => {
  it("cuenta píxeles de agua sobre los válidos", () => {
    const result = computeWaterFraction([
      { green: 0.2, nir: 0.1 },
      { green: 0.25, nir: 0.08 },
      { green: 0.18, nir: 0.12 },
      { green: 0.1, nir: 0.3 },
    ]);
    expect(result.pixelsUsed).toBe(4);
    expect(result.waterFraction).toBeCloseTo(0.75, 5);
  });

  it("ignora píxeles sin datos y devuelve null si no queda ninguno", () => {
    const mixed = computeWaterFraction([
      { green: 0.2, nir: 0.1 },
      { green: null, nir: 0.1 },
      { green: 0.2, nir: null },
    ]);
    expect(mixed.pixelsUsed).toBe(1);

    const empty = computeWaterFraction([{ green: null, nir: null }]);
    expect(empty.waterFraction).toBeNull();
    expect(empty.pixelsUsed).toBe(0);
  });
});

describe("assessWaterSufficiency", () => {
  it("es suficiente con fracción alta y píxeles suficientes", () => {
    expect(assessWaterSufficiency(0.75, 4)).toBe("sufficient");
  });

  it("es insuficiente con pocos píxeles aunque la fracción sea alta", () => {
    expect(assessWaterSufficiency(1, MIN_WATER_PIXELS - 1)).toBe("insufficient");
  });

  it("es insuficiente por debajo del umbral de fracción", () => {
    expect(assessWaterSufficiency(WATER_FRACTION_THRESHOLD - 0.01, 9)).toBe("insufficient");
  });

  it("es desconocida sin fracción calculable", () => {
    expect(assessWaterSufficiency(null, 0)).toBe("unknown");
  });
});
