/**
 * Contrato común de índice satelital — Strategy Pattern (Sprint 4)
 */

import type {
  IndexCalculationInput,
  IndexCalculationResult,
  IndexColorScaleStop,
  IndexDefinition,
  IndexInterpretation,
  IndexLegendItem,
} from "../types/index-engine.types";

export interface ISatelliteIndex {
  readonly definition: IndexDefinition;
  calculate(input: IndexCalculationInput): IndexCalculationResult;
  interpret(value: number): IndexInterpretation;
  getLegend(): IndexLegendItem[];
  getColorScale(): IndexColorScaleStop[];
}
