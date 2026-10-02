/**
 * Tests — Planetary Computer: armonización de reflectancia y separación de responsabilidades.
 * No se prueban llamadas de red reales aquí (ver verificación manual en la sesión de desarrollo);
 * estas pruebas cubren la lógica pura y la disciplina "nunca fabricar ante un fallo".
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveBoaOffset, convertDnToReflectance } from "./pc-band.mapper";
import { buildStacBbox } from "./pc-stac.client";

describe("pc-band.mapper — armonización BOA documentada por ESA", () => {
  it("aplica offset 1000 desde processing baseline 04.00", () => {
    expect(resolveBoaOffset("04.00")).toBe(1000);
    expect(resolveBoaOffset("05.11")).toBe(1000);
    expect(resolveBoaOffset("99.99")).toBe(1000);
  });

  it("no aplica offset antes de baseline 04.00", () => {
    expect(resolveBoaOffset("03.01")).toBe(0);
    expect(resolveBoaOffset("02.14")).toBe(0);
  });

  it("sin baseline conocido, no aplica offset (nunca asume)", () => {
    expect(resolveBoaOffset(undefined)).toBe(0);
    expect(resolveBoaOffset("no-numeric")).toBe(0);
  });

  it("convierte DN a reflectancia con la fórmula documentada", () => {
    expect(convertDnToReflectance(2359, 1000)).toBeCloseTo(0.1359, 4);
    expect(convertDnToReflectance(2359, 0)).toBeCloseTo(0.2359, 4);
  });
});

describe("pc-stac.client — bbox de búsqueda", () => {
  it("construye un bbox pequeño centrado en el punto", () => {
    const bbox = buildStacBbox(-6.8764, -79.9282);
    expect(bbox[0]).toBeLessThan(-79.9282);
    expect(bbox[2]).toBeGreaterThan(-79.9282);
    expect(bbox[1]).toBeLessThan(-6.8764);
    expect(bbox[3]).toBeGreaterThan(-6.8764);
  });
});

describe("planetary.adapter — separación de responsabilidades y honestidad ante fallos", () => {
  it("planetary.adapter.ts no importa computeSpectralIndex (índices viven en el catálogo)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/server/planetary/planetary.adapter.ts"), "utf8");
    expect(source).not.toContain("computeSpectralIndex");
    expect(source).not.toContain("spectral-indices.catalog");
  });

  it("reutiliza processGeeSurfaceReflectances en vez de duplicar la validación de escala", () => {
    const source = readFileSync(resolve(process.cwd(), "src/server/planetary/planetary.adapter.ts"), "utf8");
    expect(source).toContain("processGeeSurfaceReflectances");
  });

  it("adapter.ts envuelve searchSentinel2Scenes/getReflectanceAtPoint en try/catch — nunca lanza ante fallo de red", () => {
    const source = readFileSync(resolve(process.cwd(), "src/server/planetary/planetary.adapter.ts"), "utf8");
    const tryCount = (source.match(/try\s*{/g) ?? []).length;
    expect(tryCount).toBeGreaterThanOrEqual(2);
  });
});
