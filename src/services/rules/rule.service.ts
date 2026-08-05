/**
 * RuleService — observaciones técnicas y recomendaciones automáticas.
 */

import type {
  EnvironmentalAssessment,
  ParameterRuleSummary,
  RuleRecommendation,
  RuleResult,
  RuleSeverity,
} from "@/types/rules";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";
import { SEVERITY_TO_RISK_LEVEL, RULE_SEVERITY_LABELS } from "@/types/rules";

const BASE_RECOMMENDATIONS: Record<RuleSeverity, RuleRecommendation[]> = {
  normal: [
    {
      id: "rec-continue",
      priority: "low",
      text: "Continuar monitoreo según plan de campaña.",
    },
  ],
  atencion: [
    {
      id: "rec-frequency",
      priority: "medium",
      text: "Incrementar frecuencia de monitoreo.",
    },
  ],
  alerta: [
    {
      id: "rec-inspect",
      priority: "high",
      text: "Inspeccionar posibles descargas aguas arriba.",
    },
    {
      id: "rec-campaign",
      priority: "medium",
      text: "Realizar nueva campaña de verificación.",
    },
  ],
  critico: [
    {
      id: "rec-emergency",
      priority: "high",
      text: "Activar protocolo de alerta ambiental.",
    },
    {
      id: "rec-campaign-urgent",
      priority: "high",
      text: "Realizar nueva campaña de confirmación inmediata.",
    },
  ],
};

function describeViolation(summary: ParameterRuleSummary): string {
  const label = summary.label.toLowerCase();

  if (summary.parameter === "oxigenoDisuelto") {
    return `el oxígeno disuelto presenta valores inferiores al esperado`;
  }
  if (summary.parameter === "turbidez") {
    return `la turbidez supera el rango recomendado`;
  }
  if (summary.parameter === "ph") {
    return `el pH se encuentra fuera del rango óptimo`;
  }
  if (summary.parameter === "conductividad") {
    return `la conductividad supera los límites de referencia`;
  }
  if (summary.parameter === "temperatura") {
    return `la temperatura registra valores elevados`;
  }
  if (summary.parameter === "solidosDisueltos") {
    return `los sólidos totales disueltos superan el umbral`;
  }
  if (summary.parameter === "caudal") {
    return `el caudal presenta valores anómalos`;
  }

  return `${label} fuera de rango`;
}

export class RuleService {
  buildObservation(outOfRange: ParameterRuleSummary[]): string {
    if (outOfRange.length === 0) {
      return "Todos los parámetros evaluados se encuentran dentro de los rangos definidos por las reglas ambientales.";
    }

    const parts = outOfRange.map(describeViolation);

    if (parts.length === 1) {
      return `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}.`;
    }

    const last = parts.pop()!;
    const head = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
    return `${head} mientras que ${last}.`;
  }

  buildRecommendations(
    generalState: RuleSeverity,
    failedResults: RuleResult[]
  ): RuleRecommendation[] {
    const recommendations: RuleRecommendation[] = [...BASE_RECOMMENDATIONS[generalState]];
    const seen = new Set(recommendations.map((r) => r.id));

    for (const result of failedResults) {
      if (result.passed) continue;
      const actionId = `rec-${result.ruleId}`;
      if (!seen.has(actionId)) {
        recommendations.push({
          id: actionId,
          priority:
            result.severity === "critico"
              ? "high"
              : result.severity === "alerta"
                ? "medium"
                : "low",
          text: result.suggestedAction,
        });
        seen.add(actionId);
      }
    }

    return recommendations.slice(0, 6);
  }

  assembleAssessment(params: {
    stationId: string;
    stationName?: string;
    generalState: RuleSeverity;
    alertCount: number;
    outOfRange: ParameterRuleSummary[];
    results: RuleResult[];
    parameterSummaries: ParameterRuleSummary[];
  }): Pick<
    EnvironmentalAssessment,
    | "generalState"
    | "generalStateLabel"
    | "riskLevel"
    | "riskLevelLabel"
    | "alertCount"
    | "outOfRangeParameters"
    | "outOfRangeLabels"
    | "observation"
    | "recommendations"
  > {
    const riskLevel = SEVERITY_TO_RISK_LEVEL[params.generalState];
    const failedResults = params.results.filter((r) => !r.passed);

    return {
      generalState: params.generalState,
      generalStateLabel: RULE_SEVERITY_LABELS[params.generalState],
      riskLevel,
      riskLevelLabel: ENVIRONMENTAL_RISK_LABELS[riskLevel],
      alertCount: params.alertCount,
      outOfRangeParameters: params.outOfRange.map((p) => p.parameter),
      outOfRangeLabels: params.outOfRange.map((p) => p.label),
      observation: this.buildObservation(params.outOfRange),
      recommendations: this.buildRecommendations(params.generalState, failedResults),
    };
  }
}

export const ruleService = new RuleService();
