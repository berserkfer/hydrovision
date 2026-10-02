/**
 * Tests — fórmulas HydroColor (Leeuw & Boss, 2018), verificadas contra la fuente primaria.
 * Usa casos con números redondos elegidos para que el resultado esperado se pueda expresar
 * de forma exacta (ej. 1/π), en vez de números "mágicos" calculados a mano y propensos a error.
 */

import { describe, expect, it } from "vitest";
import {
  computeQualitativeColorIndex,
  computeRrsChannel,
  computeRrsRgb,
  estimateTurbidityFromRrsRed,
  HYDROCOLOR_TURBIDITY_A,
  HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED,
} from "./hydrocolor-formula";

describe("computeRrsChannel", () => {
  it("con card=0.18, sky=0, water=1 → el denominador se simplifica a π exactamente", () => {
    // denominador = (π/0.18)*card = (π/0.18)*0.18 = π ; numerador = water - 0.028*sky = 1
    const result = computeRrsChannel(1, 0, 0.18);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(1 / Math.PI, 10);
  });

  it("resta el término de reflejo del cielo (ρ=0.028) antes de dividir", () => {
    // numerador = 1 - 0.028*100 = -1.8 ; denominador = π (igual que arriba)
    const result = computeRrsChannel(1, 100, 0.18);
    expect(result).toBeCloseTo(-1.8 / Math.PI, 10);
  });

  it("una cartulina más brillante (mayor card) reduce Rrs — está en el denominador", () => {
    const dim = computeRrsChannel(100, 0, 0.18)!;
    const bright = computeRrsChannel(100, 0, 0.36)!;
    expect(bright).toBeLessThan(dim);
  });

  it("retorna null si la cartulina es 0 (denominador inválido) — nunca fabrica un valor", () => {
    expect(computeRrsChannel(100, 50, 0)).toBeNull();
  });

  it("computeRrsRgb aplica la misma ecuación de forma independiente a cada banda", () => {
    const result = computeRrsRgb({ r: 1, g: 2, b: 3 }, { r: 0, g: 0, b: 0 }, { r: 0.18, g: 0.18, b: 0.18 });
    expect(result.r).toBeCloseTo(1 / Math.PI, 10);
    expect(result.g).toBeCloseTo(2 / Math.PI, 10);
    expect(result.b).toBeCloseTo(3 / Math.PI, 10);
  });
});

describe("estimateTurbidityFromRrsRed", () => {
  it("en el punto de referencia documentado por los autores (Rrs=mitad de saturación) da exactamente 22.57 NTU", () => {
    const halfSaturation = HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED / 2; // 0.022
    const result = estimateTurbidityFromRrsRed(halfSaturation);
    expect(result.saturated).toBe(false);
    expect((result as { ntu: number }).ntu).toBeCloseTo(HYDROCOLOR_TURBIDITY_A, 6);
  });

  it("es monótonamente creciente con Rrs(rojo) por debajo de la saturación", () => {
    const low = estimateTurbidityFromRrsRed(0.01);
    const high = estimateTurbidityFromRrsRed(0.03);
    expect(low.saturated).toBe(false);
    expect(high.saturated).toBe(false);
    expect((high as { ntu: number }).ntu).toBeGreaterThan((low as { ntu: number }).ntu);
  });

  it("rechaza valores en o cerca de la saturación — nunca extrapola más allá de lo validado", () => {
    const atSaturation = estimateTurbidityFromRrsRed(HYDROCOLOR_TURBIDITY_SATURATION_RRS_RED);
    expect(atSaturation.saturated).toBe(true);
    expect(atSaturation.ntu).toBeNull();

    const nearSaturation = estimateTurbidityFromRrsRed(0.043);
    expect(nearSaturation.saturated).toBe(true);
  });

  it("rechaza Rrs no positivo o nulo sin fabricar nada", () => {
    expect(estimateTurbidityFromRrsRed(0).saturated).toBe(true);
    expect(estimateTurbidityFromRrsRed(-0.01).saturated).toBe(true);
    expect(estimateTurbidityFromRrsRed(null).saturated).toBe(true);
  });
});

describe("computeQualitativeColorIndex — sin cartulina, nunca en NTU", () => {
  it("es simplemente el ratio rojo/verde de la foto de agua", () => {
    expect(computeQualitativeColorIndex({ r: 120, g: 60, b: 40 })).toBe(2);
  });

  it("retorna null si el verde es 0 (división inválida)", () => {
    expect(computeQualitativeColorIndex({ r: 100, g: 0, b: 0 })).toBeNull();
  });
});
