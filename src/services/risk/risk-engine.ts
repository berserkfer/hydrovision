/**
 * RiskEngine — orquestador del Environmental Risk Engine.
 * Punto de entrada desacoplado de la UI.
 */

import type { StationSummary } from "@/types";
import type { EnvironmentalRiskAssessment, EnvironmentalRiskInput } from "@/types/risk";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";
import { environmentalIndicatorBuilder } from "./environmental-indicator";
import { aggregateSummariesToRiskInput, mapSummaryToRiskInput } from "./risk.mapper";
import { riskCalculator } from "./risk-calculator";
import { recommendationService } from "./recommendation.service";

export class RiskEngine {
  evaluate(input: EnvironmentalRiskInput, stationCount = 1): EnvironmentalRiskAssessment {
    const parameters = riskCalculator.evaluateParameters(input);
    const index = riskCalculator.calculateIndex(parameters);
    const level = riskCalculator.classifyIndex(index);
    const topContributors = riskCalculator.getTopRiskContributors(parameters);

    return {
      index,
      level,
      levelLabel: ENVIRONMENTAL_RISK_LABELS[level],
      parameters,
      explanation: recommendationService.buildExplanation(topContributors),
      recommendations: recommendationService.generate(level, topContributors),
      evaluatedAt: new Date().toISOString(),
      stationCount,
      isSimulated: true,
    };
  }

  evaluateStation(summary: StationSummary): EnvironmentalRiskAssessment {
    return this.evaluate(mapSummaryToRiskInput(summary), 1);
  }

  evaluateRiver(summaries: StationSummary[]): EnvironmentalRiskAssessment | null {
    const input = aggregateSummariesToRiskInput(summaries);
    if (!input) return null;
    return this.evaluate(input, summaries.length);
  }

  toIndicator(assessment: EnvironmentalRiskAssessment) {
    return environmentalIndicatorBuilder.fromAssessment(assessment);
  }
}

export const riskEngine = new RiskEngine();
