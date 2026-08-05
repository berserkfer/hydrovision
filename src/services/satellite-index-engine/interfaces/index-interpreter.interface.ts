/**
 * IndexInterpreter — interpretación de valores (Sprint 4)
 */

import type { IndexCode, IndexInterpretation } from "../types/index-engine.types";

export interface IndexInterpreter {
  interpret(code: IndexCode, value: number): IndexInterpretation;
}
