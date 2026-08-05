/**
 * TrendIndicator — transforma resultados de análisis en indicadores listos para UI.
 */

import type { TemporalAnalysisResult, TrendIndicatorData } from "@/types/temporal";

export class TrendIndicator {
  fromAnalysis(result: TemporalAnalysisResult): TrendIndicatorData {
    return result.trend;
  }

  getSummaryLine(indicator: TrendIndicatorData): string {
    return `${indicator.directionSymbol} ${indicator.directionLabel}`;
  }
}

export const trendIndicator = new TrendIndicator();
