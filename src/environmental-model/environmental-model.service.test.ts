/**
 * Tests — modelo ambiental (Dren 4000, histórico Nizama & Cabrera 2018).
 * Verifica: dataset correcto, N real reportado, sin mezclar matrices de agua, sin permitir
 * multivariante (N=10 por matriz), y que nunca fabrica un resultado cuando faltan datos.
 */

import { describe, expect, it } from "vitest";
import { buildEnvironmentalDataset } from "./environmental-dataset";
import {
  EnvironmentalModelError,
  environmentalModelService,
} from "./environmental-model.service";
import { ENV_MODEL_MIN_N_PER_PREDICTOR } from "./config/environmental-model-readiness.config";

describe("buildEnvironmentalDataset — dataset histórico real", () => {
  it("contiene exactamente 20 filas (10 puntos × 2 campañas), 10 por matriz", () => {
    const rows = buildEnvironmentalDataset();
    expect(rows).toHaveLength(20);
    expect(rows.filter((r) => r.matrix === "agua_residual")).toHaveLength(10);
    expect(rows.filter((r) => r.matrix === "agua_marina")).toHaveLength(10);
  });

  it("reproduce exactamente un valor conocido de la fuente (P5, set-2014, dbo5=201.8)", () => {
    const rows = buildEnvironmentalDataset();
    const row = rows.find((r) => r.stationCode === "P5" && r.date === "2014-09-01");
    expect(row).toBeDefined();
    expect(row?.matrix).toBe("agua_residual");
    expect(row?.values.dbo5).toBe(201.8);
    expect(row?.values.ph).toBe(8.3);
  });

  it("nitratos/fosfatos solo existen en agua_marina, nunca en agua_residual", () => {
    const rows = buildEnvironmentalDataset();
    const residual = rows.filter((r) => r.matrix === "agua_residual");
    expect(residual.every((r) => r.values.nitratos === undefined)).toBe(true);
    expect(residual.every((r) => r.values.fosfatos === undefined)).toBe(true);

    const marina = rows.filter((r) => r.matrix === "agua_marina");
    expect(marina.every((r) => typeof r.values.nitratos === "number")).toBe(true);
    expect(marina.every((r) => typeof r.values.fosfatos === "number")).toBe(true);
  });
});

describe("EnvironmentalModelService — reglas de honestidad", () => {
  it("evalúa dbo5 ~ otros parámetros en agua_residual con N=10 real, nunca fabricado", () => {
    const result = environmentalModelService.run("agua_residual", "bod5");
    expect(result.status).toBe("MODEL_EVALUATED");
    expect(result.n).toBe(10);
    expect(result.fits.length).toBeGreaterThan(0);
    for (const fit of result.fits) {
      expect(fit.n).toBe(10);
      expect(fit.sufficientData).toBe(true);
      expect(Number.isFinite(fit.metrics.r2)).toBe(true);
      expect(Number.isFinite(fit.metrics.rmse)).toBe(true);
      expect(Number.isFinite(fit.metrics.mae)).toBe(true);
    }
  });

  it("nunca ofrece nitratos/fosfatos como target u opción en agua_residual (no existen ahí)", () => {
    expect(() => environmentalModelService.run("agua_residual", "nitrates")).toThrow(
      EnvironmentalModelError
    );
    const result = environmentalModelService.run("agua_residual", "bod5");
    expect(result.fits.some((f) => f.predictorCode === "nitrates")).toBe(false);
    expect(result.fits.some((f) => f.predictorCode === "phosphates")).toBe(false);
  });

  it("en agua_marina sí evalúa nitratos y fosfatos como predictores candidatos", () => {
    const result = environmentalModelService.run("agua_marina", "bod5");
    expect(result.fits.some((f) => f.predictorCode === "nitrates")).toBe(true);
    expect(result.fits.some((f) => f.predictorCode === "phosphates")).toBe(true);
  });

  it("nunca permite un modelo multivariante — N=10 solo alcanza para 1 predictor", () => {
    const result = environmentalModelService.run("agua_marina", "total_suspended_solids");
    expect(result.multivariate.allowed).toBe(false);
    expect(result.multivariate.requiredNFor2Predictors).toBe(2 * ENV_MODEL_MIN_N_PER_PREDICTOR);
    expect(result.maxSimultaneousPredictorsAllowed).toBe(1);
  });

  it("incluye las advertencias obligatorias: no-satélite, 2 campañas, pseudo-réplica, matrices separadas", () => {
    const result = environmentalModelService.run("agua_residual", "ph");
    const joined = result.disclaimers.join(" ");
    expect(joined).toMatch(/independiente del módulo de predicción satelital/i);
    expect(joined).toMatch(/2 campañas/);
    expect(joined).toMatch(/pseudo-réplica/i);
    expect(joined).toMatch(/matrices físico-químicas distintas/i);
  });

  it("las dos matrices nunca se combinan: filtrar por agua_residual excluye estaciones P6-P10", () => {
    const residualResult = environmentalModelService.run("agua_residual", "ph");
    expect(residualResult.n).toBe(10); // 5 puntos x 2 fechas, nunca 20 (que sería mezclar ambas)
  });

  it("un código de parámetro inexistente en el catálogo lanza UNKNOWN_PARAMETER, no un resultado fabricado", () => {
    let caught: unknown = null;
    try {
      environmentalModelService.run("agua_residual", "flow_rate"); // no reportado en la fuente
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvironmentalModelError);
    expect((caught as EnvironmentalModelError).payload.status).toBe("UNKNOWN_PARAMETER");
  });
});
