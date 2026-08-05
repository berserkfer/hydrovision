/**
 * EnvironmentalIndicator — transforma evaluación de riesgo en datos para UI.
 */

import type {
  EnvironmentalIndicator,
  EnvironmentalRiskAssessment,
  EnvironmentalRiskLevel,
} from "@/types/risk";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";

const LEVEL_STYLES: Record<
  EnvironmentalRiskLevel,
  { colorClass: string; ringColor: string }
> = {
  bajo: {
    colorClass: "text-emerald-700",
    ringColor: "#10b981",
  },
  moderado: {
    colorClass: "text-amber-700",
    ringColor: "#f59e0b",
  },
  alto: {
    colorClass: "text-orange-700",
    ringColor: "#f97316",
  },
  muy_alto: {
    colorClass: "text-red-700",
    ringColor: "#ef4444",
  },
};

export class EnvironmentalIndicatorBuilder {
  fromAssessment(assessment: EnvironmentalRiskAssessment): EnvironmentalIndicator {
    const styles = LEVEL_STYLES[assessment.level];
    return {
      index: assessment.index,
      level: assessment.level,
      levelLabel: ENVIRONMENTAL_RISK_LABELS[assessment.level],
      colorClass: styles.colorClass,
      ringColor: styles.ringColor,
      explanation: assessment.explanation,
      recommendations: assessment.recommendations,
    };
  }
}

export const environmentalIndicatorBuilder = new EnvironmentalIndicatorBuilder();
