/**
 * Factory — Satellite Index Engine (Sprint 4)
 */

import { INDEX_DEFINITIONS } from "./config/index-definitions";
import type { IndexService } from "./interfaces";
import { mockIndexRepository } from "./repositories";
import {
  IndexCalculatorService,
  IndexColorScaleService,
  IndexInterpreterService,
  IndexServiceImpl,
} from "./services";
import {
  MndwiIndex,
  NdmiIndex,
  NdtiIndex,
  NdviIndex,
  NdwiIndex,
} from "./strategies";
import type { IndexCode } from "./types/index-engine.types";
import type { ISatelliteIndex } from "./interfaces/satellite-index.interface";

export type IndexEngineMode = "mock" | "gee";

function createStrategyMap(): Map<IndexCode, ISatelliteIndex> {
  const repository = mockIndexRepository;

  return new Map<IndexCode, ISatelliteIndex>([
    ["NDWI", new NdwiIndex(INDEX_DEFINITIONS.NDWI, repository)],
    ["NDVI", new NdviIndex(INDEX_DEFINITIONS.NDVI, repository)],
    ["MNDWI", new MndwiIndex(INDEX_DEFINITIONS.MNDWI, repository)],
    ["NDTI", new NdtiIndex(INDEX_DEFINITIONS.NDTI, repository)],
    ["NDMI", new NdmiIndex(INDEX_DEFINITIONS.NDMI, repository)],
  ]);
}

export class SatelliteIndexEngineFactory {
  static create(_mode: IndexEngineMode = "mock"): IndexService {
    const strategies = createStrategyMap();
    const calculator = new IndexCalculatorService(strategies);
    const interpreter = new IndexInterpreterService(calculator);
    const colorScale = new IndexColorScaleService(strategies);

    return new IndexServiceImpl(calculator, interpreter, colorScale, mockIndexRepository);
  }
}
