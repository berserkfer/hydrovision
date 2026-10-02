/**
 * Tests — reintentos ante fallos transitorios de lectura de banda (COG vía HTTP range request).
 * Un fallo de red/firma puntual en UNA banda no debe descartar esa banda de toda la observación
 * si un segundo/tercer intento sí habría funcionado — pero un punto genuinamente fuera del
 * raster (no es una excepción) NUNCA debe reintentarse ni inventar un valor.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./pc-sign.client", () => ({
  signAssetHref: vi.fn(async (href: string) => href),
}));

const getImageMock = vi.fn();
vi.mock("geotiff", () => ({
  fromUrl: vi.fn(async () => ({ getImage: getImageMock })),
}));

function buildFakeImage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    getGeoKeys: () => ({ ProjectedCSTypeGeoKey: 32717 }),
    // Bbox deliberadamente enorme — el punto de prueba siempre cae dentro, sin depender de
    // calcular a mano la proyección UTM exacta (eso ya lo prueba pc-band.mapper indirectamente).
    getBoundingBox: () => [-10_000_000, -10_000_000, 10_000_000, 10_000_000],
    getResolution: () => [10, -10],
    readRasters: async () => [[2359]],
    ...overrides,
  };
}

describe("readBandPixelAtPoint — resiliencia ante fallos transitorios", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reintenta y retorna el valor si un intento posterior tiene éxito", async () => {
    const { fromUrl } = await import("geotiff");
    const { readBandPixelAtPoint } = await import("./pc-band-reader");

    let calls = 0;
    (fromUrl as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls += 1;
      if (calls < 2) throw new Error("network blip");
      return { getImage: async () => buildFakeImage() };
    });

    const result = await readBandPixelAtPoint("https://example/B04.tif", -6.5, -79.9);

    expect(calls).toBe(2);
    expect(result).not.toBeNull();
    expect(result?.rawValue).toBe(2359);
  }, 10_000);

  it("retorna null (sin fabricar nada) si todos los intentos fallan", async () => {
    const { fromUrl } = await import("geotiff");
    const { readBandPixelAtPoint } = await import("./pc-band-reader");

    (fromUrl as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      throw new Error("persistent failure");
    });

    const result = await readBandPixelAtPoint("https://example/B04.tif", -6.5, -79.9);

    expect(result).toBeNull();
    expect((fromUrl as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  }, 10_000);

  it("un punto fuera del raster retorna null en el primer intento, sin reintentar", async () => {
    const { fromUrl } = await import("geotiff");
    const { readBandPixelAtPoint } = await import("./pc-band-reader");

    (fromUrl as ReturnType<typeof vi.fn>).mockImplementation(async () => ({
      getImage: async () => buildFakeImage({ getBoundingBox: () => [0, 0, 1, 1] }),
    }));

    const result = await readBandPixelAtPoint("https://example/B04.tif", -6.5, -79.9);

    expect(result).toBeNull();
    expect((fromUrl as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
