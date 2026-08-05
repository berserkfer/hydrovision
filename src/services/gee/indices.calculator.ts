/**
 * Calculador de índices espectrales — NDWI, NDVI, MNDWI, NDTI.
 * Fase 4: implementación con bandas Landsat/Sentinel vía GEE.
 */

import type { CalculatedIndices, SpectralIndex } from "@/types/gee";

export interface BandReflectance {
  green: number;
  red: number;
  nir: number;
  swir1: number;
}

export interface IIndicesCalculator {
  calculate(bands: BandReflectance, indices: SpectralIndex[]): CalculatedIndices;
  calculateFromMock(stationIndex: number): CalculatedIndices;
}

export class MockIndicesCalculator implements IIndicesCalculator {
  calculate(bands: BandReflectance, _indices: SpectralIndex[]): CalculatedIndices {
    const ndwi = (bands.green - bands.nir) / (bands.green + bands.nir + 1e-6);
    const ndvi = (bands.nir - bands.red) / (bands.nir + bands.red + 1e-6);
    const mndwi = (bands.green - bands.swir1) / (bands.green + bands.swir1 + 1e-6);
    const ndti = (bands.red - bands.green) / (bands.red + bands.green + 1e-6);
    return {
      ndwi: Number(ndwi.toFixed(3)),
      ndvi: Number(ndvi.toFixed(3)),
      mndwi: Number(mndwi.toFixed(3)),
      ndti: Number(ndti.toFixed(3)),
    };
  }

  calculateFromMock(stationIndex: number): CalculatedIndices {
    return {
      ndwi: Number((0.08 + (stationIndex % 6) * 0.03).toFixed(3)),
      ndvi: Number((0.32 + (stationIndex % 6) * 0.04).toFixed(3)),
      mndwi: Number((0.12 + (stationIndex % 6) * 0.025).toFixed(3)),
      ndti: Number((-0.05 + (stationIndex % 6) * 0.02).toFixed(3)),
    };
  }
}

export const indicesCalculator: IIndicesCalculator = new MockIndicesCalculator();
