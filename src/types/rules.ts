/**
 * Tipos del Environmental Rules Engine — Fase 4.5
 */

import type { EnvironmentalRiskInput, EnvironmentalRiskLevel, RiskParameterKey } from "@/types/risk";

/** Parámetro evaluable por reglas */
export type RuleParameterKey = RiskParameterKey;

/** Operadores de comparación */
export type RuleOperator = "between" | "gte" | "lte" | "gt" | "lt";

/** Clasificación de severidad de reglas */
export type RuleSeverity = "normal" | "atencion" | "alerta" | "critico";

/** Regla ambiental configurable */
export interface Rule {
  id: string;
  name: string;
  description: string;
  parameter: RuleParameterKey;
  parameterLabel: string;
  unit: string;
  operator: RuleOperator;
  expectedMin?: number;
  expectedMax?: number;
  expectedValue?: number;
  /** Severidad cuando la regla NO se cumple */
  severityOnFail: RuleSeverity;
  suggestedAction: string;
  enabled: boolean;
  priority: number;
  source: "mock" | "database";
  normativeRef?: string;
}

/** Resultado de evaluar una regla */
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  parameter: RuleParameterKey;
  parameterLabel: string;
  measuredValue: number;
  unit: string;
  passed: boolean;
  severity: RuleSeverity;
  severityLabel: string;
  suggestedAction: string;
}

/** Recomendación generada por el motor de reglas */
export interface RuleRecommendation {
  id: string;
  priority: "low" | "medium" | "high";
  text: string;
}

/** Evaluación ambiental completa de una estación o agregado */
export interface EnvironmentalAssessment {
  stationId: string;
  stationName?: string;
  generalState: RuleSeverity;
  generalStateLabel: string;
  riskLevel: EnvironmentalRiskLevel;
  riskLevelLabel: string;
  alertCount: number;
  outOfRangeParameters: RuleParameterKey[];
  outOfRangeLabels: string[];
  results: RuleResult[];
  parameterSummaries: ParameterRuleSummary[];
  observation: string;
  recommendations: RuleRecommendation[];
  evaluatedAt: string;
  isSimulated: true;
}

/** Resumen por parámetro (peor severidad aplicable) */
export interface ParameterRuleSummary {
  parameter: RuleParameterKey;
  label: string;
  value: number;
  unit: string;
  severity: RuleSeverity;
  severityLabel: string;
  passed: boolean;
}

export type RulesEvaluationInput = EnvironmentalRiskInput;

export const RULE_SEVERITY_LABELS: Record<RuleSeverity, string> = {
  normal: "Normal",
  atencion: "Atención",
  alerta: "Alerta",
  critico: "Crítico",
};

export const RULE_SEVERITY_WEIGHT: Record<RuleSeverity, number> = {
  normal: 0,
  atencion: 1,
  alerta: 2,
  critico: 3,
};

export const SEVERITY_TO_RISK_LEVEL: Record<RuleSeverity, EnvironmentalRiskLevel> = {
  normal: "bajo",
  atencion: "moderado",
  alerta: "alto",
  critico: "muy_alto",
};
