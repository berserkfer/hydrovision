/**
 * IndexInterpreterService — Sprint 4
 */

import type { IndexInterpreter } from "../interfaces/index-interpreter.interface";
import type { IndexCalculator } from "../interfaces/index-calculator.interface";
import type { IndexCode, IndexInterpretation } from "../types/index-engine.types";

export class IndexInterpreterService implements IndexInterpreter {
  constructor(private readonly calculator: IndexCalculator) {}

  interpret(code: IndexCode, value: number): IndexInterpretation {
    const strategy = this.calculator.getStrategy(code);
    if (!strategy) {
      return {
        status: "normal",
        statusLabel: "Sin datos",
        message: "Índice no disponible.",
        color: "#64748b",
      };
    }
    return strategy.interpret(value);
  }
}
