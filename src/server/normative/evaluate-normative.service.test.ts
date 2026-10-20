import { describe, expect, it } from "vitest";
import { evaluateNormativeRequest } from "@/server/normative/evaluate-normative.service";

describe("evaluateNormativeRequest", () => {
  it("resuelve E3 para la zona marina", () => {
    const result = evaluateNormativeRequest({
      pointType: "mar",
      measurement: { totalSuspendedSolids: 40 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profileId).toBe("eca-e3");
    expect(result.instrument).toBe("ECA");
    expect(result.evaluation.status).toBe("non_compliant");
  });

  it("permite forzar un perfil por id", () => {
    const result = evaluateNormativeRequest({
      profileId: "lmp-ptar",
      measurement: { bod5: 120 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profileId).toBe("lmp-ptar");
    expect(result.evaluation.status).toBe("non_compliant");
  });

  it("rechaza un perfil desconocido", () => {
    const result = evaluateNormativeRequest({
      profileId: "no-existe",
      measurement: { ph: 7 },
    });
    expect(result.ok).toBe(false);
  });

  it("exige pointType o profileId", () => {
    const result = evaluateNormativeRequest({ measurement: { ph: 7 } });
    expect(result.ok).toBe(false);
  });

  it("devuelve insufficient_data sin parámetros medidos", () => {
    const result = evaluateNormativeRequest({
      pointType: "cauce",
      measurement: {},
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.evaluation.status).toBe("insufficient_data");
  });
});
