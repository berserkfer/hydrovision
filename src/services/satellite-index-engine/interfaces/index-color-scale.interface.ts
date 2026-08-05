/**
 * IndexColorScale — escalas de color para visualización (Sprint 4)
 */

import type { IndexCode, IndexColorScaleStop, IndexLegendItem } from "../types/index-engine.types";

export interface IndexColorScale {
  getColorScale(code: IndexCode): IndexColorScaleStop[];
  getLegend(code: IndexCode): IndexLegendItem[];
  valueToColor(code: IndexCode, value: number): string;
}
