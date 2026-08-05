/**
 * Definiciones de reglas ambientales — configurables (mock, futuro PostgreSQL).
 */

import type { Rule, RuleParameterKey } from "@/types/rules";

function rangeRules(
  parameter: RuleParameterKey,
  label: string,
  unit: string,
  optimal: [number, number],
  warning: [number, number],
  critical: [number, number],
  actions: { atencion: string; alerta: string; critico: string }
): Rule[] {
  return [
    {
      id: `${parameter}-critico`,
      name: `${label} — límite crítico`,
      description: `Valor de ${label.toLowerCase()} fuera del rango crítico admisible.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "between",
      expectedMin: critical[0],
      expectedMax: critical[1],
      severityOnFail: "critico",
      suggestedAction: actions.critico,
      enabled: true,
      priority: 3,
      source: "mock",
      normativeRef: "ECA Agua — referencia orientativa",
    },
    {
      id: `${parameter}-alerta`,
      name: `${label} — zona de alerta`,
      description: `Valor de ${label.toLowerCase()} en zona de alerta ambiental.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "between",
      expectedMin: warning[0],
      expectedMax: warning[1],
      severityOnFail: "alerta",
      suggestedAction: actions.alerta,
      enabled: true,
      priority: 2,
      source: "mock",
      normativeRef: "ECA Agua — referencia orientativa",
    },
    {
      id: `${parameter}-atencion`,
      name: `${label} — rango óptimo`,
      description: `Valor de ${label.toLowerCase()} fuera del rango óptimo de monitoreo.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "between",
      expectedMin: optimal[0],
      expectedMax: optimal[1],
      severityOnFail: "atencion",
      suggestedAction: actions.atencion,
      enabled: true,
      priority: 1,
      source: "mock",
      normativeRef: "ECA Agua — referencia orientativa",
    },
  ];
}

function minRules(
  parameter: RuleParameterKey,
  label: string,
  unit: string,
  optimalMin: number,
  warningMin: number,
  criticalMin: number,
  actions: { atencion: string; alerta: string; critico: string }
): Rule[] {
  return [
    {
      id: `${parameter}-critico`,
      name: `${label} — mínimo crítico`,
      description: `${label} por debajo del umbral crítico.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "gte",
      expectedValue: criticalMin,
      severityOnFail: "critico",
      suggestedAction: actions.critico,
      enabled: true,
      priority: 3,
      source: "mock",
    },
    {
      id: `${parameter}-alerta`,
      name: `${label} — mínimo de alerta`,
      description: `${label} por debajo del umbral de alerta.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "gte",
      expectedValue: warningMin,
      severityOnFail: "alerta",
      suggestedAction: actions.alerta,
      enabled: true,
      priority: 2,
      source: "mock",
    },
    {
      id: `${parameter}-atencion`,
      name: `${label} — mínimo óptimo`,
      description: `${label} por debajo del rango óptimo.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "gte",
      expectedValue: optimalMin,
      severityOnFail: "atencion",
      suggestedAction: actions.atencion,
      enabled: true,
      priority: 1,
      source: "mock",
    },
  ];
}

function maxRules(
  parameter: RuleParameterKey,
  label: string,
  unit: string,
  optimalMax: number,
  warningMax: number,
  criticalMax: number,
  actions: { atencion: string; alerta: string; critico: string }
): Rule[] {
  return [
    {
      id: `${parameter}-critico`,
      name: `${label} — máximo crítico`,
      description: `${label} supera el umbral crítico.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "lte",
      expectedValue: criticalMax,
      severityOnFail: "critico",
      suggestedAction: actions.critico,
      enabled: true,
      priority: 3,
      source: "mock",
    },
    {
      id: `${parameter}-alerta`,
      name: `${label} — máximo de alerta`,
      description: `${label} supera el umbral de alerta.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "lte",
      expectedValue: warningMax,
      severityOnFail: "alerta",
      suggestedAction: actions.alerta,
      enabled: true,
      priority: 2,
      source: "mock",
    },
    {
      id: `${parameter}-atencion`,
      name: `${label} — máximo óptimo`,
      description: `${label} supera el rango óptimo.`,
      parameter,
      parameterLabel: label,
      unit,
      operator: "lte",
      expectedValue: optimalMax,
      severityOnFail: "atencion",
      suggestedAction: actions.atencion,
      enabled: true,
      priority: 1,
      source: "mock",
    },
  ];
}

/** Catálogo mock — reemplazable por RuleRepository.fromDatabase() */
export const DEFAULT_ENVIRONMENTAL_RULES: Rule[] = [
  ...rangeRules(
    "ph",
    "pH",
    "—",
    [6.8, 8.2],
    [6.5, 8.5],
    [6.0, 9.0],
    {
      atencion: "Continuar monitoreo y registrar desviación de pH.",
      alerta: "Incrementar frecuencia de monitoreo en la estación.",
      critico: "Inspeccionar posibles descargas ácidas o alcalinas aguas arriba.",
    }
  ),
  ...minRules("oxigenoDisuelto", "Oxígeno Disuelto", "mg/L", 6, 4, 2, {
    atencion: "Continuar monitoreo del oxígeno disuelto.",
    alerta: "Incrementar frecuencia de monitoreo — posible deficit de oxigenación.",
    critico: "Inspeccionar posibles descargas orgánicas y activar protocolo de alerta.",
  }),
  ...maxRules("conductividad", "Conductividad", "µS/cm", 500, 1500, 2500, {
    atencion: "Continuar monitoreo de conductividad.",
    alerta: "Investigar posibles aportes iónicos — incrementar monitoreo.",
    critico: "Realizar nueva campaña de caracterización de fuentes contaminantes.",
  }),
  ...maxRules("temperatura", "Temperatura", "°C", 26, 30, 35, {
    atencion: "Continuar monitoreo de temperatura.",
    alerta: "Incrementar frecuencia de monitoreo en horarios de mayor estrés térmico.",
    critico: "Evaluar impacto de descargas térmicas — inspección in situ urgente.",
  }),
  ...maxRules("turbidez", "Turbidez", "NTU", 20, 35, 50, {
    atencion: "Continuar monitoreo de turbidez.",
    alerta: "Inspeccionar posibles descargas de sólidos en suspensión.",
    critico: "Realizar nueva campaña — incremento crítico de turbidez.",
  }),
  ...maxRules("solidosDisueltos", "Sólidos Totales Disueltos", "mg/L", 500, 800, 1200, {
    atencion: "Continuar monitoreo de sólidos disueltos.",
    alerta: "Incrementar frecuencia de monitoreo — posible incremento de sales.",
    critico: "Inspeccionar posibles descargas minero-industriales.",
  }),
  ...rangeRules(
    "caudal",
    "Caudal",
    "m³/s",
    [1.5, 8],
    [0.5, 12],
    [0.2, 15],
    {
      atencion: "Continuar monitoreo hidrométrico.",
      alerta: "Incrementar monitoreo — caudal anómalo en el tramo.",
      critico: "Evaluar evento hidrológico extremo o alteración del régimen.",
    }
  ),
];
