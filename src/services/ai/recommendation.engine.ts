/**
 * Motor de recomendaciones ambientales — Fase 6.
 */

import type { Recommendation, RecommendationContext } from "@/types/ai";

export interface IRecommendationEngine {
  generate(context: RecommendationContext): Promise<Recommendation[]>;
}

export class MockRecommendationEngine implements IRecommendationEngine {
  async generate(context: RecommendationContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (context.complianceStatus === "non_compliant") {
      recommendations.push({
        id: "rec-urgent-sampling",
        priority: "high",
        title: "Intensificar muestreo",
        description: "Programar muestreo de seguimiento en 48–72 h por incumplimiento ECA.",
        actionType: "monitoring",
      });
    }

    if (context.riskScore >= 0.5) {
      recommendations.push({
        id: "rec-field-inspection",
        priority: "medium",
        title: "Inspección de campo",
        description: "Verificar posibles fuentes de contaminación aguas arriba de la estación.",
        actionType: "intervention",
      });
    }

    recommendations.push({
      id: "rec-report",
      priority: "low",
      title: "Generar reporte técnico",
      description: "Documentar hallazgos para el informe de tesis.",
      actionType: "report",
    });

    return recommendations;
  }
}

export const recommendationEngine: IRecommendationEngine = new MockRecommendationEngine();
