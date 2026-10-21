import { describe, expect, it } from "vitest";
import {
  estimateSubpixel,
  extractEndmembers,
  isSubpixelUnmixingEnabled,
  unmixFullyConstrained,
  type Spectrum,
  type UnmixPixel,
} from "./subpixel-unmixing";

// Endmembers sintéticos (reflectancia): agua, suelo desnudo, vegetación.
const WATER: Spectrum = { B03: 0.06, B04: 0.04, B08: 0.02 };
const SOIL: Spectrum = { B03: 0.12, B04: 0.15, B08: 0.22 };
const VEG: Spectrum = { B03: 0.05, B04: 0.04, B08: 0.35 };

function mix(fw: number, fs: number, fv: number): UnmixPixel {
  return {
    B03: fw * WATER.B03 + fs * SOIL.B03 + fv * VEG.B03,
    B04: fw * WATER.B04 + fs * SOIL.B04 + fv * VEG.B04,
    B08: fw * WATER.B08 + fs * SOIL.B08 + fv * VEG.B08,
    scl: 5,
  };
}

/** Escena: 20 píxeles puros de cada clase con variación pequeña y determinista (±2 %). */
function scene(include: { water?: boolean; soil?: boolean; veg?: boolean } = {}): UnmixPixel[] {
  const out: UnmixPixel[] = [];
  const jitter = (s: Spectrum, i: number, scl: number): UnmixPixel => {
    const k = 1 + ((i % 5) - 2) * 0.01;
    return { B03: s.B03 * k, B04: s.B04 * k, B08: s.B08 * (2 - k), scl };
  };
  for (let i = 0; i < 20; i += 1) {
    if (include.water !== false) out.push(jitter(WATER, i, 6));
    if (include.soil !== false) out.push(jitter(SOIL, i, 5));
    if (include.veg !== false) out.push(jitter(VEG, i, 4));
  }
  return out;
}

describe("mezcla subpíxel (experimental)", () => {
  it("está desactivada por defecto", () => {
    expect(isSubpixelUnmixingEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    expect(isSubpixelUnmixingEnabled({ SUBPIXEL_UNMIXING_ENABLED: "true" } as unknown as NodeJS.ProcessEnv)).toBe(true);
  });

  it("toma los endmembers de la propia escena", () => {
    const em = extractEndmembers(scene());
    expect(em.agua?.pixels).toBe(20);
    expect(em.agua?.spectrum.B03).toBeCloseTo(WATER.B03, 3);
    expect(em.vegetacion?.spectrum.B08).toBeCloseTo(VEG.B08, 3);
  });

  it("recupera exactamente una mezcla conocida (restricciones f ≥ 0 y Σf = 1)", () => {
    const r = mix(0.3, 0.3, 0.4) as unknown as Spectrum;
    const solved = unmixFullyConstrained(r, [WATER, SOIL, VEG])!;
    expect(solved.fractions[0]).toBeCloseTo(0.3, 6);
    expect(solved.fractions[1]).toBeCloseTo(0.3, 6);
    expect(solved.fractions[2]).toBeCloseTo(0.4, 6);
    expect(solved.rmse).toBeLessThan(1e-9);
  });

  it("nunca devuelve fracciones negativas aunque la mezcla quede fuera del triángulo", () => {
    const r: Spectrum = { B03: 0.02, B04: 0.01, B08: 0.005 }; // más oscuro que el agua pura
    const solved = unmixFullyConstrained(r, [WATER, SOIL, VEG])!;
    expect(solved.fractions.every((f) => f >= 0)).toBe(true);
    expect(solved.fractions.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it("40 % agua + 60 % suelo: estima f_agua y la reflectancia corregida del agua", () => {
    const est = estimateSubpixel(mix(0.4, 0.6, 0), scene());
    expect(est.experimental).toBe(true);
    expect(est.status).toBe("ok");
    expect(est.fractions!.agua).toBeCloseTo(0.4, 1);
    expect(est.fractions!.suelo).toBeCloseTo(0.6, 1);
    expect(est.fractions!.vegetacion).toBeLessThan(0.05);
    expect(est.correctedWaterReflectance!.B03).toBeCloseTo(WATER.B03, 2);
    expect(est.correctedWaterReflectance!.B08).toBeCloseTo(WATER.B08, 2);
    // Con la variabilidad de los endmembers hay una incertidumbre > 0 pero acotada.
    expect(est.waterFractionStd).toBeGreaterThan(0);
    expect(est.waterFractionStd).toBeLessThan(0.1);
    expect(est.correctedWaterReflectanceStd).not.toBeNull();
  });

  it("la incertidumbre es reproducible (semilla fija)", () => {
    const a = estimateSubpixel(mix(0.5, 0.25, 0.25), scene(), { seed: 7 });
    const b = estimateSubpixel(mix(0.5, 0.25, 0.25), scene(), { seed: 7 });
    expect(a).toEqual(b);
  });

  it("con poca agua no corrige (amplificaría el error)", () => {
    const est = estimateSubpixel(mix(0.1, 0.9, 0), scene());
    expect(est.status).toBe("low_water_fraction");
    expect(est.correctedWaterReflectance).toBeNull();
    expect(est.fractions!.agua).toBeCloseTo(0.1, 1);
  });

  it("sin un endmember puro en la escena no inventa uno", () => {
    const est = estimateSubpixel(mix(0.5, 0.5, 0), scene({ veg: false }));
    expect(est.status).toBe("missing_endmember");
    expect(est.message).toMatch(/vegetacion/);
    expect(est.fractions).toBeNull();
  });

  it("píxel del punto sin bandas válidas", () => {
    expect(estimateSubpixel({ B03: null, B04: 0.1, B08: 0.1, scl: 5 }, scene()).status).toBe("invalid_pixel");
  });
});
