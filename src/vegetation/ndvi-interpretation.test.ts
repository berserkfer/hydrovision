import { describe, expect, it } from "vitest";
import { interpretNdviVigor } from "./ndvi-interpretation";

describe("interpretNdviVigor", () => {
  it("clasifica valores bajos como sin vegetación", () => {
    expect(interpretNdviVigor(0.05).level).toBe("sin_vegetacion");
  });

  it("clasifica vegetación dispersa", () => {
    expect(interpretNdviVigor(0.25).level).toBe("dispersa");
  });

  it("clasifica vegetación moderada", () => {
    expect(interpretNdviVigor(0.5).level).toBe("moderada");
  });

  it("clasifica vegetación densa", () => {
    expect(interpretNdviVigor(0.7).level).toBe("densa");
  });

  it("clasifica vegetación muy densa", () => {
    expect(interpretNdviVigor(0.9).level).toBe("muy_densa");
  });

  it("maneja los límites exactos de cada corte sin ambigüedad", () => {
    expect(interpretNdviVigor(0.2).level).toBe("dispersa");
    expect(interpretNdviVigor(0.4).level).toBe("moderada");
    expect(interpretNdviVigor(0.6).level).toBe("densa");
    expect(interpretNdviVigor(0.8).level).toBe("muy_densa");
  });
});
