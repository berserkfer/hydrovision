import { describe, expect, it } from "vitest";
import { evaluateLagoonVegetationAlert } from "./lagoon-alert.service";

describe("evaluateLagoonVegetationAlert", () => {
  it("nunca emite una alerta cuando no se encontró escena", () => {
    const result = evaluateLagoonVegetationAlert({ found: false }, 0.4);
    expect(result.status).toBe("insufficient_data");
    expect(result.value).toBeNull();
  });

  it("nunca emite una alerta cuando el valor es null aunque found sea true", () => {
    const result = evaluateLagoonVegetationAlert({ found: true, value: null }, 0.4);
    expect(result.status).toBe("insufficient_data");
  });

  it("marca alerta cuando el valor iguala o supera el umbral", () => {
    expect(evaluateLagoonVegetationAlert({ found: true, value: 0.4 }, 0.4).status).toBe("alert");
    expect(evaluateLagoonVegetationAlert({ found: true, value: 0.55 }, 0.4).status).toBe("alert");
  });

  it("marca normal cuando el valor está por debajo del umbral", () => {
    const result = evaluateLagoonVegetationAlert({ found: true, value: 0.1 }, 0.4);
    expect(result.status).toBe("normal");
  });

  it("respeta un umbral distinto al configurado por el usuario", () => {
    expect(evaluateLagoonVegetationAlert({ found: true, value: 0.3 }, 0.2).status).toBe("alert");
    expect(evaluateLagoonVegetationAlert({ found: true, value: 0.3 }, 0.5).status).toBe("normal");
  });
});
