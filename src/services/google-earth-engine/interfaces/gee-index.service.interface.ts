/**
 * Contrato de índices espectrales GEE — Sprint 1
 */

import type { SpectralIndex } from "@/types/gee";
import type { GeeIndexRequest, GeeIndexResult } from "../types/gee.types";

export interface GEEIndexService {
  getSupportedIndices(): SpectralIndex[];

  /** Cálculo simulado — Sprint 2 conectará con GEE real */
  calculateIndex(request: GeeIndexRequest): Promise<GeeIndexResult>;

  calculateBatch(requests: GeeIndexRequest[]): Promise<GeeIndexResult[]>;
}
