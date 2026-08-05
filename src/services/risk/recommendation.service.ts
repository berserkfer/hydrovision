/**
 * RecommendationService — genera recomendaciones operativas según el riesgo evaluado.
 */

import type {
  EnvironmentalRecommendation,
  EnvironmentalRiskLevel,
  ParameterRiskScore,
} from "@/types/risk";
import { PARAMETER_RISK_LABELS } from "@/types/risk";

const BASE_RECOMMENDATIONS: Record<EnvironmentalRiskLevel, EnvironmentalRecommendation[]> = {
  bajo: [
    {
      id: "rec-routine",
      priority: "low",
      text: "Continuar monitoreo mensual según plan de campaña.",
    },
    {
      id: "rec-document",
      priority: "low",
      text: "Mantener registro actualizado de parámetros fisicoquímicos.",
    },
  ],
  moderado: [
    {
      id: "rec-frequency",
      priority: "medium",
      text: "Incrementar la frecuencia de monitoreo a quincenal.",
    },
    {
      id: "rec-review",
      priority: "medium",
      text: "Revisar tendencias históricas de parámetros en alerta.",
    },
  ],
  alto: [
    {
      id: "rec-inspection",
      priority: "high",
      text: "Realizar inspección de fuentes contaminantes aguas arriba.",
    },
    {
      id: "rec-frequency-high",
      priority: "high",
      text: "Incrementar la frecuencia de monitoreo a semanal.",
    },
  ],
  muy_alto: [
    {
      id: "rec-emergency",
      priority: "high",
      text: "Activar protocolo de alerta ambiental y notificar autoridades.",
    },
    {
      id: "rec-sampling",
      priority: "high",
      text: "Ejecutar muestreo de confirmación en estaciones críticas.",
    },
    {
      id: "rec-source",
      priority: "high",
      text: "Identificar y caracterizar posibles fuentes de contaminación.",
    },
  ],
};

const PARAMETER_RECOMMENDATIONS: Partial<
  Record<ParameterRiskScore["key"], EnvironmentalRecommendation>
> = {
  oxigenoDisuelto: {
    id: "rec-do",
    priority: "high",
    text: "Evaluar posible deficit de oxigenación — revisar descargas orgánicas.",
  },
  turbidez: {
    id: "rec-turb",
    priority: "medium",
    text: "Investigar incremento de sólidos en suspensión — erosión o vertidos.",
  },
  conductividad: {
    id: "rec-cond",
    priority: "medium",
    text: "Verificar posible aporte de sales o contaminantes iónicos.",
  },
  ph: {
    id: "rec-ph",
    priority: "medium",
    text: "Analizar desviaciones de pH — posible influencia ácida o alcalina.",
  },
};

export class RecommendationService {
  generate(
    level: EnvironmentalRiskLevel,
    topContributors: ParameterRiskScore[]
  ): EnvironmentalRecommendation[] {
    const recommendations: EnvironmentalRecommendation[] = [...BASE_RECOMMENDATIONS[level]];
    const seen = new Set(recommendations.map((r) => r.id));

    for (const param of topContributors) {
      if (param.score <= 45) continue;
      const specific = PARAMETER_RECOMMENDATIONS[param.key];
      if (specific && !seen.has(specific.id)) {
        recommendations.push(specific);
        seen.add(specific.id);
      }
    }

    return recommendations.slice(0, 5);
  }

  buildExplanation(topContributors: ParameterRiskScore[]): string {
    const significant = topContributors.filter((p) => p.score > 30);
    if (significant.length === 0) {
      return "Los parámetros evaluados se encuentran dentro de rangos aceptables para la cuenca.";
    }

    const parts = significant.map((p) => {
      const level = PARAMETER_RISK_LABELS[p.level].toLowerCase();
      if (p.key === "oxigenoDisuelto" && p.score > 45) {
        return "baja concentración de oxígeno disuelto";
      }
      if (p.key === "turbidez" && p.score > 45) {
        return "incremento de la turbidez";
      }
      if (p.key === "conductividad" && p.score > 45) {
        return "elevada conductividad";
      }
      if (p.key === "ph" && p.score > 45) {
        return "desviación del pH";
      }
      if (p.key === "temperatura" && p.score > 45) {
        return "temperatura fuera de rango óptimo";
      }
      if (p.key === "solidosDisueltos" && p.score > 45) {
        return "elevados sólidos disueltos totales";
      }
      if (p.key === "caudal" && p.score > 45) {
        return "caudal anómalo en el tramo";
      }
      return `${p.label.toLowerCase()} en nivel ${level}`;
    });

    if (parts.length === 1) {
      return `El riesgo se asocia principalmente a ${parts[0]}.`;
    }

    const last = parts.pop();
    return `El riesgo aumenta debido a ${parts.join(", ")} y ${last}.`;
  }
}

export const recommendationService = new RecommendationService();
