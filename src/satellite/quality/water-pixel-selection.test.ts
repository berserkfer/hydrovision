import { describe, expect, it } from "vitest";
import {
  classifyScl,
  getWaterSearchRadiusM,
  requiredGridHalfSize,
  selectWaterPixel,
  type GridPixel,
  type PixelGrid,
} from "./water-pixel-selection";

// Reflectancias típicas: agua (verde > NIR → NDWI > 0) y suelo (NIR > verde → NDWI < 0).
const WATER: GridPixel = { green: 0.08, nir: 0.02, scl: 6 };
const SOIL: GridPixel = { green: 0.1, nir: 0.25, scl: 5 };
const VEG: GridPixel = { green: 0.06, nir: 0.35, scl: 4 };
const CLOUD: GridPixel = { green: 0.4, nir: 0.42, scl: 9 };
const SHADOW: GridPixel = { green: 0.02, nir: 0.01, scl: 3 };

/** Rejilla 9×9 (radio 30 m + ventana 3×3) rellena con `fill`, con celdas puestas a mano. */
function grid(fill: GridPixel, set: Array<[number, number, GridPixel]> = [], size = 9): PixelGrid {
  const pixels = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ ...fill })));
  for (const [r, c, p] of set) pixels[r][c] = { ...p };
  return { pixels, pixelSizeM: 10 };
}

/** Coloca una franja de agua (cauce) en las columnas indicadas, filas completas. */
function channel(columns: number[], size = 9): Array<[number, number, GridPixel]> {
  const cells: Array<[number, number, GridPixel]> = [];
  for (let r = 0; r < size; r += 1) for (const c of columns) cells.push([r, c, WATER]);
  return cells;
}

describe("máscara SCL", () => {
  it("descarta nube, sombra, cirros y nieve; conserva agua, suelo y vegetación", () => {
    expect(classifyScl(6)).toBe("water");
    expect(classifyScl(5)).toBe("land");
    expect(classifyScl(4)).toBe("land");
    for (const scl of [3, 8, 9, 10, 11]) expect(classifyScl(scl)).toBe("contaminated");
    for (const scl of [0, 1, 2, 7, null]) expect(classifyScl(scl)).toBe("invalid");
  });
});

describe("selectWaterPixel", () => {
  it("píxel central de agua dentro del cauce: se usa sin ajuste", () => {
    const result = selectWaterPixel(grid(SOIL, channel([3, 4, 5])), { searchRadiusM: 30 });
    expect(result.status).toBe("center_water");
    expect(result.usable).toBe(true);
    expect(result.adjustmentDistanceM).toBe(0);
    expect(result.pixelOffset).toEqual({ dRow: 0, dCol: 0 });
    expect(result.window).toMatchObject({ waterPixels: 9, validPixels: 9, waterFraction: 1 });
  });

  it("píxel central de suelo con agua adyacente: se ajusta al agua más cercana", () => {
    // Cauce de 2 columnas a la derecha del punto (columnas 5 y 6; el punto está en la 4).
    const result = selectWaterPixel(grid(SOIL, channel([5, 6])), { searchRadiusM: 30 });
    expect(result.status).toBe("adjusted");
    expect(result.usable).toBe(true);
    expect(result.pixelOffset).toEqual({ dRow: 0, dCol: 1 });
    expect(result.adjustmentDistanceM).toBe(10);
    expect(result.selectedScl).toBe(6);
    expect(result.selectedNdwi).toBeGreaterThan(0);
    // Ventana 3×3 alrededor de la columna 5: columnas 4 (suelo), 5 y 6 (agua) → 6/9.
    expect(result.window.waterPixels).toBe(6);
    expect(result.window.waterFraction).toBeCloseTo(0.6667, 3);
    expect(result.reason).toMatch(/Ajustado/);
  });

  it("sin agua dentro del radio: se bloquea", () => {
    // El agua más cercana está a 4 píxeles (40 m) del punto: fuera de 30 m.
    const result = selectWaterPixel(grid(SOIL, channel([8])), { searchRadiusM: 30 });
    expect(result.status).toBe("blocked_no_water_in_radius");
    expect(result.usable).toBe(false);
    expect(result.pixelOffset).toBeNull();
    expect(result.adjustmentDistanceM).toBe(0);
    expect(result.reason).toMatch(/30 m/);
  });

  it("ventana con nubes: la escena se descarta para el punto", () => {
    const result = selectWaterPixel(grid(WATER, [[3, 3, CLOUD]]), { searchRadiusM: 30 });
    expect(result.status).toBe("discarded_clouds");
    expect(result.usable).toBe(false);
    expect(result.window.contaminatedPixels).toBe(1);
  });

  it("la sombra de nube junto al punto también descarta", () => {
    const result = selectWaterPixel(grid(WATER, [[4, 5, SHADOW]]));
    expect(result.status).toBe("discarded_clouds");
  });

  it("si la ventana del píxel ajustado tiene nubes, también se descarta", () => {
    const cells = [...channel([6, 7]), [3, 7, CLOUD] as [number, number, GridPixel]];
    const result = selectWaterPixel(grid(SOIL, cells), { searchRadiusM: 30 });
    expect(result.status).toBe("discarded_clouds");
    expect(result.pixelOffset).not.toBeNull();
  });

  it("no se ajusta a un píxel de agua aislado (fuera del cauce)", () => {
    // Un único píxel de agua a 10 m: no forma un cuerpo de agua conexo de ≥ 3 píxeles.
    const result = selectWaterPixel(grid(SOIL, [[4, 5, WATER]]), { searchRadiusM: 30 });
    expect(result.status).toBe("blocked_no_water_in_radius");
    expect(result.channelCheck).toBe("connected_water_body");
  });

  it("con un polígono de cauce configurado, solo acepta píxeles dentro de él", () => {
    // Agua a ambos lados, a la misma distancia (columnas 2 y 6); el cauce declarado está
    // solo al oeste (dCol < 0). El cauce oeste tiene 2 columnas para que su ventana cumpla f_agua.
    const result = selectWaterPixel(grid(SOIL, channel([1, 2, 6, 7])), {
      searchRadiusM: 30,
      isInChannel: (_dRow, dCol) => dCol < 0,
    });
    expect(result.status).toBe("adjusted");
    expect(result.pixelOffset?.dCol).toBe(-2);
    expect(result.channelCheck).toBe("channel_polygon");
  });

  it("píxel central de agua con ventana mayormente de orilla: bloqueo por f_agua", () => {
    // Cauce de 1 columna: ventana 3×3 = 3 de agua / 9 válidos = 0,33 < 0,5.
    const result = selectWaterPixel(grid(VEG, channel([4])), { searchRadiusM: 30 });
    expect(result.status).toBe("blocked_insufficient_water");
    expect(result.usable).toBe(false);
    expect(result.window.waterFraction).toBeCloseTo(0.3333, 3);
  });

  it("SCL = agua pero NDWI ≤ 0 no cuenta como agua", () => {
    const turbidShallow: GridPixel = { green: 0.1, nir: 0.12, scl: 6 };
    const result = selectWaterPixel(grid(turbidShallow), { searchRadiusM: 30 });
    expect(result.status).toBe("blocked_no_water_in_radius");
    expect(result.reason).toMatch(/NDWI ≤ 0/);
  });

  it("sin datos válidos devuelve no_data, nunca un valor inventado", () => {
    const empty: GridPixel = { green: null, nir: null, scl: null };
    expect(selectWaterPixel(grid(empty)).status).toBe("no_data");
  });

  it("el radio es configurable y está acotado", () => {
    expect(getWaterSearchRadiusM({} as NodeJS.ProcessEnv)).toBe(30);
    expect(getWaterSearchRadiusM({ WATER_PIXEL_SEARCH_RADIUS_M: "20" } as unknown as NodeJS.ProcessEnv)).toBe(20);
    expect(getWaterSearchRadiusM({ WATER_PIXEL_SEARCH_RADIUS_M: "500" } as unknown as NodeJS.ProcessEnv)).toBe(60);
    expect(requiredGridHalfSize(30)).toBe(4);
    // Con radio 10 m, el agua a 20 m ya no se alcanza.
    expect(selectWaterPixel(grid(SOIL, channel([6, 7])), { searchRadiusM: 10 }).status).toBe(
      "blocked_no_water_in_radius"
    );
  });
});
