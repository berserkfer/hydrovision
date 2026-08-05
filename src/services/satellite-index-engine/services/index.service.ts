/**
 * IndexService — fachada del Satellite Index Engine (Sprint 4)
 */

import { SUPPORTED_INDEX_CODES } from "../config/index-definitions";
import type { IndexService } from "../interfaces/index-service.interface";
import type { IndexCalculator } from "../interfaces/index-calculator.interface";
import type { IndexColorScale } from "../interfaces/index-color-scale.interface";
import type { IndexInterpreter } from "../interfaces/index-interpreter.interface";
import type { IndexRepository } from "../interfaces/index-repository.interface";
import type {
  IndexCode,
  IndexDashboardItem,
  IndexEngineSnapshot,
  IndexTemporalComparison,
  IndexTrend,
} from "../types/index-engine.types";

export class IndexServiceImpl implements IndexService {
  constructor(
    private readonly calculator: IndexCalculator,
    private readonly interpreter: IndexInterpreter,
    private readonly colorScale: IndexColorScale,
    private readonly repository: IndexRepository
  ) {}

  getSnapshotForStation(stationId: string, riverId: string): IndexEngineSnapshot {
    return this.buildSnapshot(stationId, riverId);
  }

  getSnapshotForRiver(riverId: string): IndexEngineSnapshot {
    const stationIds = this.repository.getStationIdsForRiver(riverId);
    const primaryStationId = stationIds[0] ?? `${riverId}-p1`;
    return this.buildSnapshot(primaryStationId, riverId, stationIds);
  }

  private buildSnapshot(
    stationId: string,
    riverId: string,
    stationIdsForAverage?: string[]
  ): IndexEngineSnapshot {
    const input = { stationId, riverId };
    const items: IndexDashboardItem[] = SUPPORTED_INDEX_CODES.map((code) => {
      const result =
        stationIdsForAverage && stationIdsForAverage.length > 1
          ? this.calculateRiverAverage(code, riverId, stationIdsForAverage)
          : this.calculator.calculate(code, input);

      const interpretation = this.interpreter.interpret(code, result.value);
      const previousValue = this.repository.getPreviousValue(stationId, code, result.value);

      return {
        definition: this.calculator.getStrategy(code)!.definition,
        result,
        interpretation,
        legend: this.colorScale.getLegend(code),
        colorScale: this.colorScale.getColorScale(code),
        temporal: this.buildTemporalComparison(code, result.value, previousValue),
      };
    });

    return {
      items,
      stationId,
      riverId,
      generatedAt: new Date().toISOString(),
      source: "simulated",
    };
  }

  private calculateRiverAverage(code: IndexCode, riverId: string, stationIds: string[]) {
    const results = stationIds.map((id) =>
      this.calculator.calculate(code, { stationId: id, riverId })
    );
    const average =
      results.reduce((sum, item) => sum + item.value, 0) / Math.max(results.length, 1);

    return {
      ...results[0],
      value: Number(average.toFixed(4)),
      calculatedAt: new Date().toISOString(),
    };
  }

  private buildTemporalComparison(
    code: IndexCode,
    currentValue: number,
    previousValue: number
  ): IndexTemporalComparison {
    const variation = Number((currentValue - previousValue).toFixed(4));
    const variationPercent =
      previousValue === 0
        ? 0
        : Number(((variation / Math.abs(previousValue)) * 100).toFixed(1));

    let trend: IndexTrend = "stable";
    if (Math.abs(variationPercent) >= 2) {
      trend = variation > 0 ? "up" : "down";
    }

    const trendLabel =
      trend === "up" ? "Tendencia al alza" : trend === "down" ? "Tendencia a la baja" : "Estable";

    return {
      code,
      currentValue,
      previousValue,
      variation,
      variationPercent,
      trend,
      trendLabel,
    };
  }
}
