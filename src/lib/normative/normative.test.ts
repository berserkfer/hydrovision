import { describe, expect, it } from "vitest";
import {
  ECA_D1,
  ECA_E2,
  ECA_E3,
  LMP_PESCA,
  LMP_PTAR,
  evaluateNormative,
  resolveProfileForPointType,
} from "@/lib/normative";
import { classifyForPointType, toComplianceResult } from "@/lib/eca/classifier";
import type { FieldMeasurement } from "@/types";

function measurement(overrides: Partial<FieldMeasurement> = {}): FieldMeasurement {
  return {
    id: "m-1",
    stationId: "P6",
    sampledAt: "2014-03-01",
    isSimulated: false,
    ...overrides,
  };
}

describe("motor normativo — ECA", () => {
  it("E2: pH central cumple y pH fuera de rango no cumple", () => {
    expect(evaluateNormative(measurement({ ph: 7.4 }), ECA_E2).status).toBe("compliant");
    expect(evaluateNormative(measurement({ ph: 6.2 }), ECA_E2).status).toBe("non_compliant");
    expect(evaluateNormative(measurement({ ph: 9.4 }), ECA_E2).status).toBe("non_compliant");
  });

  it("E2: pH cercano al límite queda en alerta", () => {
    const result = evaluateNormative(measurement({ ph: 6.6 }), ECA_E2);
    expect(result.status).toBe("alert");
  });

  it("E2: SST sobre 100 mg/L no cumple y 95 queda en alerta", () => {
    expect(
      evaluateNormative(measurement({ totalSuspendedSolids: 120 }), ECA_E2).status
    ).toBe("non_compliant");
    expect(
      evaluateNormative(measurement({ totalSuspendedSolids: 95 }), ECA_E2).status
    ).toBe("alert");
    expect(
      evaluateNormative(measurement({ totalSuspendedSolids: 50 }), ECA_E2).status
    ).toBe("compliant");
  });

  it("E3 es más exigente que E2 en SST", () => {
    const value = measurement({ totalSuspendedSolids: 40 });
    expect(evaluateNormative(value, ECA_E2).status).toBe("compliant");
    expect(evaluateNormative(value, ECA_E3).status).toBe("non_compliant");
  });

  it("E3: pH marino fuera de 6,8–8,5 no cumple", () => {
    expect(evaluateNormative(measurement({ ph: 8.0 }), ECA_E3).status).toBe("compliant");
    expect(evaluateNormative(measurement({ ph: 6.7 }), ECA_E3).status).toBe("non_compliant");
  });

  it("D1: DQO mayor a 40 no cumple", () => {
    expect(evaluateNormative(measurement({ cod: 50 }), ECA_D1).status).toBe("non_compliant");
  });

  it("fosfatos queda como no aplicable porque el ECA limita fósforo total", () => {
    const result = evaluateNormative(measurement({ phosphates: 1.5 }), ECA_E2);
    const phosphates = result.parameters.find((p) => p.parameter === "phosphates");
    expect(phosphates?.status).toBe("not_applicable");
    expect(result.status).not.toBe("non_compliant");
  });

  it("sin parámetros medidos devuelve insufficient_data", () => {
    expect(evaluateNormative(measurement(), ECA_E2).status).toBe("insufficient_data");
  });
});

describe("motor normativo — LMP", () => {
  it("PTAR: DBO5 120 no cumple y 90 queda en alerta", () => {
    expect(evaluateNormative(measurement({ bod5: 120 }), LMP_PTAR).status).toBe("non_compliant");
    expect(evaluateNormative(measurement({ bod5: 90 }), LMP_PTAR).status).toBe("alert");
  });

  it("PTAR: coliformes termotolerantes sobre 10 000 no cumplen", () => {
    const result = evaluateNormative(
      measurement({ thermotolerantColiforms: 12000 }),
      LMP_PTAR
    );
    expect(result.status).toBe("non_compliant");
  });

  it("PTAR: temperatura sobre 35 °C no cumple", () => {
    expect(evaluateNormative(measurement({ temperature: 36 }), LMP_PTAR).status).toBe(
      "non_compliant"
    );
  });

  it("PESCA: DBO5 sobre 60 no cumple", () => {
    expect(evaluateNormative(measurement({ bod5: 70 }), LMP_PESCA).status).toBe(
      "non_compliant"
    );
    expect(evaluateNormative(measurement({ bod5: 40 }), LMP_PESCA).status).toBe("compliant");
  });

  it("usa coliformes totales como aproximación y lo advierte", () => {
    const result = evaluateNormative(measurement({ coliforms: 15000 }), LMP_PTAR);
    const coliformes = result.parameters.find(
      (p) => p.parameter === "thermotolerantColiforms"
    );
    expect(coliformes?.status).toBe("non_compliant");
    expect(coliformes?.note).toContain("aproximación");
  });
});

describe("resolución por tipo de punto", () => {
  it("mapea efluentes, cauce y mar a su instrumento", () => {
    expect(resolveProfileForPointType("efluente_ptar").id).toBe("lmp-ptar");
    expect(resolveProfileForPointType("efluente_pesca").id).toBe("lmp-pesca");
    expect(resolveProfileForPointType("cauce").id).toBe("eca-e2");
    expect(resolveProfileForPointType("mar").id).toBe("eca-e3");
  });

  it("clasifica por tipo de punto y adapta al contrato histórico", () => {
    const evaluation = classifyForPointType(measurement({ bod5: 70 }), "efluente_pesca");
    expect(evaluation.status).toBe("non_compliant");
    const legacy = toComplianceResult(evaluation);
    expect(legacy.status).toBe("non_compliant");
    expect(legacy.violatedParameters).toContain("bod5");
  });
});
