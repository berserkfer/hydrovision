import { describe, expect, it } from "vitest";
import { NECHAD_TSM_RED_MODEL } from "./nechad-tsm.model";
import { applyLiteratureModel, getLiteratureModel } from "./literature-model-registry";

describe("NECHAD_TSM_RED_MODEL — Nechad et al. (2010), banda roja 665nm", () => {
  it("calcula SST (mg/L) con la ecuación publicada para una reflectancia típica de agua turbia", () => {
    // ρw=0.05 -> S = 352.61*0.05/(1-0.05/0.1728) + 1.74
    const reflectance = 0.05;
    const expected = (352.61 * reflectance) / (1 - reflectance / 0.1728) + 1.74;
    const result = NECHAD_TSM_RED_MODEL.compute(reflectance);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(expected, 2);
    expect(result).toBeGreaterThan(0);
  });

  it("rechaza reflectancias no positivas o no finitas sin fabricar un valor", () => {
    expect(NECHAD_TSM_RED_MODEL.compute(0)).toBeNull();
    expect(NECHAD_TSM_RED_MODEL.compute(-0.01)).toBeNull();
    expect(NECHAD_TSM_RED_MODEL.compute(Number.NaN)).toBeNull();
  });

  it("rechaza reflectancias cerca/por encima del límite asintótico Cρ (fuera del régimen válido)", () => {
    expect(NECHAD_TSM_RED_MODEL.compute(0.1728)).toBeNull();
    expect(NECHAD_TSM_RED_MODEL.compute(0.3)).toBeNull();
  });

  it("expone la cita completa y las advertencias de transferibilidad", () => {
    expect(NECHAD_TSM_RED_MODEL.citation.doi).toBe("10.1016/j.rse.2009.11.022");
    expect(NECHAD_TSM_RED_MODEL.transferabilityWarning).toMatch(/NO calibrado con datos de Dren 4000/);
  });
});

describe("literature-model-registry", () => {
  it("registra un modelo para total_suspended_solids pero ninguno para turbidity (sin fuente verificada aún)", () => {
    expect(getLiteratureModel("total_suspended_solids")).not.toBeNull();
    expect(getLiteratureModel("turbidity")).toBeNull();
  });

  it("applyLiteratureModel retorna null si falta la banda B04 requerida", () => {
    expect(applyLiteratureModel("total_suspended_solids", { B03: 0.04 })).toBeNull();
    expect(applyLiteratureModel("total_suspended_solids", undefined)).toBeNull();
  });

  it("applyLiteratureModel retorna una estimación completa con reflectancia B04 válida", () => {
    const estimate = applyLiteratureModel("total_suspended_solids", { B04: 0.04 });
    expect(estimate).not.toBeNull();
    expect(estimate?.unit).toBe("mg/L");
    expect(estimate?.inputBand).toBe("B04");
    expect(estimate?.predictedValue).toBeGreaterThan(0);
    expect(estimate?.disclaimer).toMatch(/NO calibrado con datos locales/);
  });

  it("applyLiteratureModel retorna null para un parámetro sin modelo registrado", () => {
    expect(applyLiteratureModel("turbidity", { B04: 0.04 })).toBeNull();
  });
});
