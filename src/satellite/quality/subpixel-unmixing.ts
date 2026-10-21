/**
 * Mezcla subpíxel — EXPERIMENTAL, desactivada por defecto (SUBPIXEL_UNMIXING_ENABLED=true).
 *
 * Estima qué fracción del píxel del punto es agua por mezcla espectral lineal con tres
 * endmembers (agua, suelo, vegetación) tomados de la PROPIA escena, y entrega una reflectancia
 * del agua "corregida" de la mezcla con la orilla:
 *
 *   r = f_agua·e_agua + f_suelo·e_suelo + f_veg·e_veg,   f ≥ 0,  Σf = 1
 *   r_agua = (r − f_suelo·e_suelo − f_veg·e_veg) / f_agua
 *
 * Bandas: B03, B04, B08 (las tres de 10 m). Restricciones completas (no negativas y suma 1),
 * resueltas exactamente probando cada subconjunto de endmembers.
 *
 * Incertidumbre: Monte Carlo (semilla fija) perturbando los endmembers con su variabilidad en
 * la escena, más el residuo del ajuste. Este resultado NO entra en pares de calibración ni en
 * R², RMSE o MAE de la tesis: se muestra y exporta con la etiqueta "experimental".
 */

import { classifyScl } from "./water-pixel-selection";

export const UNMIX_BANDS = ["B03", "B04", "B08"] as const;
export type UnmixBand = (typeof UNMIX_BANDS)[number];
export type Spectrum = Record<UnmixBand, number>;

export const MIN_ENDMEMBER_PIXELS = 5;
/** Por debajo de esta fracción de agua la corrección amplifica demasiado el error. */
export const MIN_WATER_FRACTION_FOR_CORRECTION = 0.2;
export const MONTE_CARLO_RUNS = 200;

export function isSubpixelUnmixingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SUBPIXEL_UNMIXING_ENABLED === "true";
}

export interface UnmixPixel {
  B03: number | null;
  B04: number | null;
  B08: number | null;
  scl: number | null;
}

export interface Endmember {
  spectrum: Spectrum;
  std: Spectrum;
  pixels: number;
}

export type EndmemberName = "agua" | "suelo" | "vegetacion";

export type SubpixelStatus = "ok" | "low_water_fraction" | "missing_endmember" | "invalid_pixel";

export interface SubpixelEstimate {
  experimental: true;
  status: SubpixelStatus;
  message: string;
  fractions: { agua: number; suelo: number; vegetacion: number } | null;
  waterFractionStd: number | null;
  residualRmse: number | null;
  correctedWaterReflectance: Spectrum | null;
  correctedWaterReflectanceStd: Spectrum | null;
  endmembers: Partial<Record<EndmemberName, { spectrum: Spectrum; pixels: number }>>;
}

const ndwi = (p: Spectrum) => (p.B03 - p.B08) / (p.B03 + p.B08);
const ndvi = (p: Spectrum) => (p.B08 - p.B04) / (p.B08 + p.B04);

function complete(p: UnmixPixel): Spectrum | null {
  if (p.B03 == null || p.B04 == null || p.B08 == null) return null;
  if (![p.B03, p.B04, p.B08].every(Number.isFinite)) return null;
  if (p.B03 + p.B08 <= 0 || p.B08 + p.B04 <= 0) return null;
  return { B03: p.B03, B04: p.B04, B08: p.B08 };
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function std(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / Math.max(1, values.length - 1));
}

function summarize(spectra: Spectrum[]): Endmember {
  const pick = (b: UnmixBand) => spectra.map((s) => s[b]);
  return {
    spectrum: { B03: median(pick("B03")), B04: median(pick("B04")), B08: median(pick("B08")) },
    std: { B03: std(pick("B03")), B04: std(pick("B04")), B08: std(pick("B08")) },
    pixels: spectra.length,
  };
}

/**
 * Endmembers "puros" de la escena: agua SCL 6 con NDWI > 0,2; suelo SCL 5 con NDVI < 0,25;
 * vegetación SCL 4 con NDVI > 0,5. Se usa la mediana; se exige un mínimo de píxeles.
 */
export function extractEndmembers(pixels: UnmixPixel[]): Partial<Record<EndmemberName, Endmember>> {
  const groups: Record<EndmemberName, Spectrum[]> = { agua: [], suelo: [], vegetacion: [] };
  for (const p of pixels) {
    const s = complete(p);
    if (!s) continue;
    const scl = p.scl == null ? null : Math.round(p.scl);
    if (classifyScl(p.scl) === "contaminated") continue;
    if (scl === 6 && ndwi(s) > 0.2) groups.agua.push(s);
    else if (scl === 5 && ndvi(s) < 0.25) groups.suelo.push(s);
    else if (scl === 4 && ndvi(s) > 0.5) groups.vegetacion.push(s);
  }
  const out: Partial<Record<EndmemberName, Endmember>> = {};
  for (const name of Object.keys(groups) as EndmemberName[]) {
    if (groups[name].length >= MIN_ENDMEMBER_PIXELS) out[name] = summarize(groups[name]);
  }
  return out;
}

/** Resuelve A x = b (2×2 o 1×1) por fórmula cerrada; null si es singular. */
function solveSmall(a: number[][], b: number[]): number[] | null {
  if (a.length === 1) return Math.abs(a[0][0]) < 1e-12 ? null : [b[0] / a[0][0]];
  const det = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  if (Math.abs(det) < 1e-12) return null;
  return [(b[0] * a[1][1] - a[0][1] * b[1]) / det, (a[0][0] * b[1] - b[0] * a[1][0]) / det];
}

/** Mínimos cuadrados con Σf = 1 para un subconjunto de endmembers. */
function sumToOneLeastSquares(r: Spectrum, members: Spectrum[]): number[] | null {
  const k = members.length;
  if (k === 1) return [1];
  const last = members[k - 1];
  // r − e_k = Σ_{i<k} f_i (e_i − e_k)
  const cols = members.slice(0, k - 1).map((m) => UNMIX_BANDS.map((b) => m[b] - last[b]));
  const y = UNMIX_BANDS.map((b) => r[b] - last[b]);
  const ata = cols.map((ci) => cols.map((cj) => ci.reduce((s, v, n) => s + v * cj[n], 0)));
  const aty = cols.map((ci) => ci.reduce((s, v, n) => s + v * y[n], 0));
  const head = solveSmall(ata, aty);
  if (!head) return null;
  return [...head, 1 - head.reduce((a, b) => a + b, 0)];
}

function residual(r: Spectrum, members: Spectrum[], f: number[]): number {
  const errs = UNMIX_BANDS.map((b) => r[b] - members.reduce((s, m, i) => s + f[i] * m[b], 0));
  return Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length);
}

/**
 * Desmezcla totalmente restringida (f ≥ 0, Σf = 1): con ≤ 3 endmembers se prueba cada
 * subconjunto y se elige la solución factible de menor residuo.
 */
export function unmixFullyConstrained(r: Spectrum, members: Spectrum[]): { fractions: number[]; rmse: number } | null {
  let best: { fractions: number[]; rmse: number } | null = null;
  const n = members.length;
  for (let mask = 1; mask < 1 << n; mask += 1) {
    const idx = [...Array(n).keys()].filter((i) => mask & (1 << i));
    const f = sumToOneLeastSquares(r, idx.map((i) => members[i]));
    if (!f || f.some((v) => v < -1e-9)) continue;
    const full = Array(n).fill(0) as number[];
    idx.forEach((i, j) => (full[i] = Math.max(0, f[j])));
    const rmse = residual(r, members, full);
    if (!best || rmse < best.rmse - 1e-12) best = { fractions: full, rmse };
  }
  return best;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar (Box–Muller) con generador reproducible. */
function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function correctWater(r: Spectrum, f: number[], members: Spectrum[], waterIndex: number): Spectrum {
  const out = {} as Spectrum;
  for (const b of UNMIX_BANDS) {
    const others = members.reduce((s, m, i) => (i === waterIndex ? s : s + f[i] * m[b]), 0);
    out[b] = (r[b] - others) / f[waterIndex];
  }
  return out;
}

const round = (v: number, d = 4) => Number(v.toFixed(d));
const roundSpectrum = (s: Spectrum, d = 4): Spectrum => ({ B03: round(s.B03, d), B04: round(s.B04, d), B08: round(s.B08, d) });

/** Estima la mezcla del píxel `target` con endmembers de `scenePixels`. */
export function estimateSubpixel(
  target: UnmixPixel,
  scenePixels: UnmixPixel[],
  options: { runs?: number; seed?: number } = {}
): SubpixelEstimate {
  const base = {
    experimental: true as const,
    fractions: null,
    waterFractionStd: null,
    residualRmse: null,
    correctedWaterReflectance: null,
    correctedWaterReflectanceStd: null,
  };
  const r = complete(target);
  if (!r) {
    return { ...base, status: "invalid_pixel", message: "El píxel del punto no tiene B03/B04/B08 válidos.", endmembers: {} };
  }
  const em = extractEndmembers(scenePixels);
  const endmembers = Object.fromEntries(
    Object.entries(em).map(([k, v]) => [k, { spectrum: roundSpectrum(v.spectrum), pixels: v.pixels }])
  ) as SubpixelEstimate["endmembers"];
  const missing = (["agua", "suelo", "vegetacion"] as EndmemberName[]).filter((k) => !em[k]);
  if (missing.length > 0) {
    return {
      ...base,
      status: "missing_endmember",
      message: `Sin endmember puro de ${missing.join(", ")} en la escena cercana (se exigen ≥ ${MIN_ENDMEMBER_PIXELS} píxeles).`,
      endmembers,
    };
  }

  const order: EndmemberName[] = ["agua", "suelo", "vegetacion"];
  const members = order.map((k) => em[k]!.spectrum);
  const solved = unmixFullyConstrained(r, members);
  if (!solved) {
    return { ...base, status: "invalid_pixel", message: "No se pudo resolver la mezcla (endmembers degenerados).", endmembers };
  }
  const fw = solved.fractions[0];
  const fractions = { agua: round(fw), suelo: round(solved.fractions[1]), vegetacion: round(solved.fractions[2]) };

  // Monte Carlo: endmembers perturbados con su variabilidad en la escena.
  const rand = mulberry32(options.seed ?? 4000);
  const runs = options.runs ?? MONTE_CARLO_RUNS;
  const fwSamples: number[] = [];
  const corrSamples: Spectrum[] = [];
  for (let i = 0; i < runs; i += 1) {
    const perturbed = order.map((k) => {
      const e = em[k]!;
      return {
        B03: Math.max(0, e.spectrum.B03 + gaussian(rand) * e.std.B03),
        B04: Math.max(0, e.spectrum.B04 + gaussian(rand) * e.std.B04),
        B08: Math.max(0, e.spectrum.B08 + gaussian(rand) * e.std.B08),
      };
    });
    const s = unmixFullyConstrained(r, perturbed);
    if (!s) continue;
    fwSamples.push(s.fractions[0]);
    if (s.fractions[0] >= MIN_WATER_FRACTION_FOR_CORRECTION) corrSamples.push(correctWater(r, s.fractions, perturbed, 0));
  }
  const waterFractionStd = fwSamples.length > 1 ? round(std(fwSamples)) : null;

  if (fw < MIN_WATER_FRACTION_FOR_CORRECTION) {
    return {
      ...base,
      status: "low_water_fraction",
      message: `Fracción de agua estimada ${fractions.agua} < ${MIN_WATER_FRACTION_FOR_CORRECTION}: la corrección amplificaría demasiado el error.`,
      fractions,
      waterFractionStd,
      residualRmse: round(solved.rmse, 5),
      endmembers,
    };
  }

  const corrected = correctWater(r, solved.fractions, members, 0);
  const correctedStd =
    corrSamples.length > 1
      ? roundSpectrum({
          B03: std(corrSamples.map((s) => s.B03)),
          B04: std(corrSamples.map((s) => s.B04)),
          B08: std(corrSamples.map((s) => s.B08)),
        })
      : null;

  return {
    experimental: true,
    status: "ok",
    message: "Estimación experimental por mezcla espectral lineal; no entra en la calibración ni en las métricas de la tesis.",
    fractions,
    waterFractionStd,
    residualRmse: round(solved.rmse, 5),
    correctedWaterReflectance: roundSpectrum(corrected),
    correctedWaterReflectanceStd: correctedStd,
    endmembers,
  };
}
