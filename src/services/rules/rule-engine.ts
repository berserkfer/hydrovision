/**
 * RuleEngine — orquestador del Environmental Rules Engine.
 * Punto de entrada desacoplado de la interfaz.
 */

import { mapSummaryToRiskInput } from "@/services/risk/risk.mapper";
import type { StationSummary } from "@/types";
import type { EnvironmentalAssessment, RulesEvaluationInput } from "@/types/rules";
import { ruleEvaluator } from "./rule-evaluator";
import { ruleRepository } from "./rule.repository";
import { ruleService } from "./rule.service";

export class RuleEngine {
  evaluate(
    input: RulesEvaluationInput,
    stationId: string,
    stationName?: string
  ): EnvironmentalAssessment {
    const rules = ruleRepository.getEnabled();
    const results = ruleEvaluator.evaluateAll(rules, input);
    const parameterSummaries = ruleEvaluator.summarizeByParameter(results);
    const generalState = ruleEvaluator.resolveGeneralState(parameterSummaries);
    const outOfRange = ruleEvaluator.getOutOfRangeParameters(parameterSummaries);
    const alertCount = ruleEvaluator.countAlerts(parameterSummaries);

    const assembled = ruleService.assembleAssessment({
      stationId,
      stationName,
      generalState,
      alertCount,
      outOfRange,
      results,
      parameterSummaries,
    });

    return {
      stationId,
      stationName,
      ...assembled,
      results,
      parameterSummaries,
      evaluatedAt: new Date().toISOString(),
      isSimulated: true,
    };
  }

  evaluateStation(summary: StationSummary): EnvironmentalAssessment {
    const input = mapSummaryToRiskInput(summary);
    return this.evaluate(input, summary.station.id, summary.station.name);
  }

  evaluateRiver(summaries: StationSummary[]): EnvironmentalAssessment | null {
    if (summaries.length === 0) return null;

    const assessments = summaries.map((s) => this.evaluateStation(s));
    const worst = assessments.reduce((a, b) =>
      this.compareSeverity(a.generalState, b.generalState) >= 0 ? a : b
    );

    const allOutOfRange = new Set<string>();
    let totalAlerts = 0;
    for (const a of assessments) {
      totalAlerts += a.alertCount;
      a.outOfRangeLabels.forEach((l) => allOutOfRange.add(l));
    }

    const outOfRangeLabels = Array.from(allOutOfRange);
    const outOfRangeParameters = [
      ...new Set(assessments.flatMap((a) => a.outOfRangeParameters)),
    ];

    return {
      ...worst,
      stationId: "river-aggregate",
      stationName: `Agregado (${summaries.length} estaciones)`,
      alertCount: totalAlerts,
      outOfRangeParameters,
      outOfRangeLabels,
      observation:
        outOfRangeLabels.length > 0
          ? `Evaluación agregada: ${outOfRangeLabels.length} parámetro(s) fuera de rango en al menos una estación. ${worst.observation}`
          : worst.observation,
      results: worst.results,
      parameterSummaries: worst.parameterSummaries,
      evaluatedAt: new Date().toISOString(),
    };
  }

  getRules() {
    return ruleRepository.getAll();
  }

  private compareSeverity(a: EnvironmentalAssessment["generalState"], b: EnvironmentalAssessment["generalState"]): number {
    const weights = { normal: 0, atencion: 1, alerta: 2, critico: 3 };
    return weights[a] - weights[b];
  }
}

export const ruleEngine = new RuleEngine();
