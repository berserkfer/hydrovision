/**
 * ActionRecommendationService — acciones recomendadas según nivel de riesgo.
 */

import type { ExecutiveAction } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";

const RISK_ACTIONS: Record<
  NonNullable<EnvironmentalRiskAssessment["level"]>,
  ExecutiveAction[]
> = {
  bajo: [
    {
      id: "act-routine",
      priority: "low",
      text: "Continuar monitoreo mensual según calendario de campañas.",
    },
    {
      id: "act-document",
      priority: "low",
      text: "Mantener registro actualizado de parámetros fisicoquímicos.",
    },
  ],
  moderado: [
    {
      id: "act-frequency",
      priority: "medium",
      text: "Incrementar la frecuencia de monitoreo a quincenal.",
    },
    {
      id: "act-temporal",
      priority: "medium",
      text: "Revisar tendencias históricas en el módulo de Análisis Temporal.",
    },
  ],
  alto: [
    {
      id: "act-inspection",
      priority: "high",
      text: "Realizar inspección de fuentes contaminantes aguas arriba.",
    },
    {
      id: "act-weekly",
      priority: "high",
      text: "Programar muestreos semanales en estaciones críticas.",
    },
  ],
  muy_alto: [
    {
      id: "act-emergency",
      priority: "high",
      text: "Activar protocolo de alerta ambiental y notificar autoridades.",
    },
    {
      id: "act-confirm",
      priority: "high",
      text: "Ejecutar muestreo de confirmación en todas las estaciones afectadas.",
    },
    {
      id: "act-source",
      priority: "high",
      text: "Identificar y caracterizar posibles fuentes de contaminación.",
    },
  ],
};

export class ActionRecommendationService {
  generate(riskAssessment: EnvironmentalRiskAssessment | null): ExecutiveAction[] {
    if (!riskAssessment) {
      return RISK_ACTIONS.bajo;
    }

    const base = [...RISK_ACTIONS[riskAssessment.level]];
    const seen = new Set(base.map((a) => a.id));

    for (const rec of riskAssessment.recommendations) {
      if (!seen.has(rec.id) && base.length < 5) {
        base.push({ id: rec.id, priority: rec.priority, text: rec.text });
        seen.add(rec.id);
      }
    }

    return base;
  }
}

export const actionRecommendationService = new ActionRecommendationService();
