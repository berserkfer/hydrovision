/**
 * IndexCalculator — orquestador de cálculo (Sprint 4)
 */

import type { IndexCalculationInput, IndexCalculationResult, IndexCode } from "../types/index-engine.types";
import type { ISatelliteIndex } from "./satellite-index.interface";

export interface IndexCalculator {
  calculate(code: IndexCode, input: IndexCalculationInput): IndexCalculationResult;
  calculateAll(input: IndexCalculationInput): IndexCalculationResult[];
  getStrategy(code: IndexCode): ISatelliteIndex | undefined;
  getSupportedCodes(): IndexCode[];
}
