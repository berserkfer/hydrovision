/**
 * Tests — catálogo de bandas Sentinel-2
 */

import { describe, expect, it } from "vitest";
import {
  SENTINEL2_BANDS,
  SENTINEL2_BAND_CODES,
  getSentinel2Band,
  isSentinel2BandCode,
  maxSpatialResolution,
} from "@/satellite/catalog/sentinel2-bands.catalog";

describe("Sentinel-2 bands catalog", () => {
  it("incluye las 10 bandas preparadas (B02–B12)", () => {
    expect(SENTINEL2_BAND_CODES).toHaveLength(10);
    expect(SENTINEL2_BAND_CODES).toContain("B02");
    expect(SENTINEL2_BAND_CODES).toContain("B8A");
    expect(SENTINEL2_BAND_CODES).toContain("B12");
  });

  it("expone resolución espacial por banda", () => {
    expect(getSentinel2Band("B02").spatialResolutionMeters).toBe(10);
    expect(getSentinel2Band("B05").spatialResolutionMeters).toBe(20);
    expect(getSentinel2Band("B11").spatialResolutionMeters).toBe(20);
  });

  it("valida códigos de banda", () => {
    expect(isSentinel2BandCode("B04")).toBe(true);
    expect(isSentinel2BandCode("B99")).toBe(false);
  });

  it("calcula resolución máxima de un conjunto de bandas", () => {
    expect(maxSpatialResolution(["B02", "B04"])).toBe(10);
    expect(maxSpatialResolution(["B02", "B05"])).toBe(20);
  });

  it("cada banda tiene longitud de onda y uso documentado", () => {
    for (const code of SENTINEL2_BAND_CODES) {
      const band = SENTINEL2_BANDS[code];
      expect(band.centralWavelengthNm).toBeGreaterThan(0);
      expect(band.waterQualityUse.length).toBeGreaterThan(10);
    }
  });
});
