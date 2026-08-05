/**
 * IndexColorScaleService — escalas y leyendas (Sprint 4)
 */

import type { IndexColorScale } from "../interfaces/index-color-scale.interface";
import type { IndexCode, IndexColorScaleStop, IndexLegendItem } from "../types/index-engine.types";
import type { ISatelliteIndex } from "../interfaces/satellite-index.interface";

export class IndexColorScaleService implements IndexColorScale {
  constructor(private readonly strategies: Map<IndexCode, ISatelliteIndex>) {}

  getColorScale(code: IndexCode): IndexColorScaleStop[] {
    return this.strategies.get(code)?.getColorScale() ?? [];
  }

  getLegend(code: IndexCode): IndexLegendItem[] {
    return this.strategies.get(code)?.getLegend() ?? [];
  }

  valueToColor(code: IndexCode, value: number): string {
    const stops = this.getColorScale(code);
    if (stops.length === 0) return "#64748b";

    const sorted = [...stops].sort((a, b) => a.value - b.value);
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      if (value >= sorted[i].value) {
        return sorted[i].color;
      }
    }

    return sorted[0]?.color ?? "#64748b";
  }
}
