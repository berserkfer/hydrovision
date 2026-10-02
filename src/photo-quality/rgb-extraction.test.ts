import { describe, expect, it } from "vitest";
import { averageRgbFromImageData, type ImageDataLike } from "./rgb-extraction";

/** Construye una imagen sintética 6×6 RGBA: todo blanco excepto un centro 2×2 negro. */
function buildTestImage(): ImageDataLike {
  const width = 6;
  const height = 6;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const isCenter = x >= 2 && x <= 3 && y >= 2 && y <= 3;
      const [r, g, b] = isCenter ? [0, 0, 0] : [255, 255, 255];
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("averageRgbFromImageData", () => {
  it("promedia SOLO el recuadro central, ignorando el borde — con boxFraction=0.34 selecciona el 2×2 central", () => {
    const image = buildTestImage();
    const result = averageRgbFromImageData(image, 0.34);
    expect(result).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("con boxFraction=1 promedia toda la imagen (borde blanco domina sobre el centro negro)", () => {
    const image = buildTestImage();
    const result = averageRgbFromImageData(image, 1);
    // 32 píxeles blancos (255) + 4 píxeles negros (0) de 36 totales
    const expectedChannel = Number(((255 * 32) / 36).toFixed(3));
    expect(result?.r).toBeCloseTo(expectedChannel, 2);
  });

  it("una imagen uniforme da exactamente ese color sin importar el recuadro", () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      data[i * 4] = 10;
      data[i * 4 + 1] = 20;
      data[i * 4 + 2] = 30;
      data[i * 4 + 3] = 255;
    }
    const result = averageRgbFromImageData({ width, height, data }, 0.5);
    expect(result).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("retorna null para dimensiones inválidas, nunca fabrica un promedio", () => {
    expect(averageRgbFromImageData({ width: 0, height: 10, data: [] })).toBeNull();
    expect(averageRgbFromImageData({ width: 10, height: 0, data: [] })).toBeNull();
  });
});
