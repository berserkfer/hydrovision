/**
 * Servicio de índices espectrales simulado — Sprint 1
 */

import type { SpectralIndex } from "@/types/gee";
import type { GEEIndexService } from "../interfaces";
import type { GeeIndexRequest, GeeIndexResult } from "../types/gee.types";

const MOCK_VALUES: Record<SpectralIndex, Pick<GeeIndexResult, "mean" | "min" | "max">> = {
  NDWI: { mean: 0.18, min: -0.12, max: 0.42 },
  NDVI: { mean: 0.52, min: 0.08, max: 0.81 },
  MNDWI: { mean: 0.11, min: -0.2, max: 0.35 },
  NDTI: { mean: 0.04, min: -0.05, max: 0.19 },
};

export class MockGeeIndexService implements GEEIndexService {
  getSupportedIndices(): SpectralIndex[] {
    return ["NDWI", "NDVI", "MNDWI", "NDTI"];
  }

  async calculateIndex(request: GeeIndexRequest): Promise<GeeIndexResult> {
    const stats = MOCK_VALUES[request.index];

    return {
      index: request.index,
      mean: stats.mean,
      min: stats.min,
      max: stats.max,
      sampleCount: 128,
      source: "simulated",
      computedAt: new Date().toISOString(),
    };
  }

  async calculateBatch(requests: GeeIndexRequest[]): Promise<GeeIndexResult[]> {
    return Promise.all(requests.map((request) => this.calculateIndex(request)));
  }
}
