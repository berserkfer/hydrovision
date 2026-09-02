/**
 * Tests — separación sourceType e isSimulated
 */

import { describe, expect, it } from "vitest";
import {
  isFieldSource,
  isModelSource,
  isSatelliteSource,
  type DataOriginMeta,
} from "@/satellite/types/data-origin.types";
import { ESTIMATED_VARIABLE_DEFINITIONS } from "@/satellite/catalog/estimated-variables.catalog";
import { mapMockIndicesToObservation } from "@/server/satellite/satellite.mappers";
import type { IndicesSatelitales } from "@/models/satellite";
import { FuenteSatelital } from "@/constants/enums";

describe("data origin sourceType", () => {
  it("distingue field, satellite y model", () => {
    const field: DataOriginMeta = { sourceType: "field", isSimulated: false };
    const satellite: DataOriginMeta = { sourceType: "satellite", isSimulated: true };
    const model: DataOriginMeta = { sourceType: "model", isSimulated: true };

    expect(isFieldSource(field)).toBe(true);
    expect(isSatelliteSource(satellite)).toBe(true);
    expect(isModelSource(model)).toBe(true);
  });

  it("variables estimadas declaran proxy/model y disclaimer", () => {
    const turbidity = ESTIMATED_VARIABLE_DEFINITIONS.turbidity_estimated;
    expect(turbidity.derivationKind).toBe("proxy");
    expect(turbidity.disclaimer).toMatch(/estimada/i);
    expect(turbidity.name).toMatch(/estimada/i);
  });
});

describe("satellite mappers", () => {
  const mockRow: IndicesSatelitales = {
    id: "sat-test",
    estacionId: "est-e01",
    fechaAdquisicion: "2025-06-10",
    fuente: FuenteSatelital.SENTINEL_2,
    ndwi: 0.1,
    ndvi: 0.3,
    mndwi: 0.12,
    ndti: -0.05,
    coberturaNubosa: 8,
    isSimulated: true,
    createdAt: "2025-06-10T00:00:00.000Z",
    updatedAt: "2025-06-10T00:00:00.000Z",
  };

  it("mapea mock a observación satelital con sourceType satellite", () => {
    const obs = mapMockIndicesToObservation(mockRow);
    expect(obs.sourceType).toBe("satellite");
    expect(obs.isSimulated).toBe(true);
    expect(obs.indices.NDVI).toBe(0.3);
    expect(obs.estimatedVariables.every((v) => v.status === "not_available")).toBe(true);
  });
});
