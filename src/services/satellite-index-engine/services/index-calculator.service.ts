/**
 * IndexCalculatorService — Strategy Pattern (Sprint 4)
 */

import { SUPPORTED_INDEX_CODES } from "../config/index-definitions";
import type { IndexCalculator } from "../interfaces/index-calculator.interface";
import type { ISatelliteIndex } from "../interfaces/satellite-index.interface";
import type {
  IndexCalculationInput,
  IndexCalculationResult,
  IndexCode,
} from "../types/index-engine.types";

export class IndexCalculatorService implements IndexCalculator {
  constructor(private readonly strategies: Map<IndexCode, ISatelliteIndex>) {}

  calculate(code: IndexCode, input: IndexCalculationInput): IndexCalculationResult {
    const strategy = this.strategies.get(code);
    if (!strategy) {
      throw new Error(`Índice no soportado: ${code}`);
    }
    return strategy.calculate(input);
  }

  calculateAll(input: IndexCalculationInput): IndexCalculationResult[] {
    return SUPPORTED_INDEX_CODES.map((code) => this.calculate(code, input));
  }

  getStrategy(code: IndexCode): ISatelliteIndex | undefined {
    return this.strategies.get(code);
  }

  getSupportedCodes(): IndexCode[] {
    return [...SUPPORTED_INDEX_CODES];
  }
}
