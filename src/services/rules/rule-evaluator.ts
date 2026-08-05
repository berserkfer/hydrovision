/**
 * RuleEvaluator — evalúa reglas contra valores medidos.
 */

import type {
  ParameterRuleSummary,
  Rule,
  RuleResult,
  RulesEvaluationInput,
  RuleSeverity,
} from "@/types/rules";
import { RULE_SEVERITY_LABELS, RULE_SEVERITY_WEIGHT } from "@/types/rules";

function getParameterValue(input: RulesEvaluationInput, parameter: Rule["parameter"]): number {
  return input[parameter];
}

function evaluateOperator(rule: Rule, value: number): boolean {
  switch (rule.operator) {
    case "between":
      return (
        value >= (rule.expectedMin ?? -Infinity) && value <= (rule.expectedMax ?? Infinity)
      );
    case "gte":
      return value >= (rule.expectedValue ?? 0);
    case "lte":
      return value <= (rule.expectedValue ?? Infinity);
    case "gt":
      return value > (rule.expectedValue ?? 0);
    case "lt":
      return value < (rule.expectedValue ?? Infinity);
    default:
      return true;
  }
}

function maxSeverity(a: RuleSeverity, b: RuleSeverity): RuleSeverity {
  return RULE_SEVERITY_WEIGHT[a] >= RULE_SEVERITY_WEIGHT[b] ? a : b;
}

export class RuleEvaluator {
  evaluateRule(rule: Rule, input: RulesEvaluationInput): RuleResult {
    const measuredValue = getParameterValue(input, rule.parameter);
    const passed = evaluateOperator(rule, measuredValue);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      parameter: rule.parameter,
      parameterLabel: rule.parameterLabel,
      measuredValue,
      unit: rule.unit,
      passed,
      severity: passed ? "normal" : rule.severityOnFail,
      severityLabel: passed ? RULE_SEVERITY_LABELS.normal : RULE_SEVERITY_LABELS[rule.severityOnFail],
      suggestedAction: rule.suggestedAction,
    };
  }

  evaluateAll(rules: Rule[], input: RulesEvaluationInput): RuleResult[] {
    return rules
      .filter((r) => r.enabled)
      .map((rule) => this.evaluateRule(rule, input));
  }

  /** Agrupa por parámetro — conserva la peor severidad entre reglas incumplidas */
  summarizeByParameter(results: RuleResult[]): ParameterRuleSummary[] {
    const grouped = new Map<string, RuleResult[]>();

    for (const result of results) {
      const list = grouped.get(result.parameter) ?? [];
      list.push(result);
      grouped.set(result.parameter, list);
    }

    return Array.from(grouped.entries()).map(([parameter, paramResults]) => {
      const failed = paramResults.filter((r) => !r.passed);
      const severity =
        failed.length === 0
          ? "normal"
          : failed.reduce(
              (worst, r) => maxSeverity(worst, r.severity),
              "normal" as RuleSeverity
            );

      const sample = paramResults[0];
      return {
        parameter: parameter as ParameterRuleSummary["parameter"],
        label: sample.parameterLabel,
        value: sample.measuredValue,
        unit: sample.unit,
        severity,
        severityLabel: RULE_SEVERITY_LABELS[severity],
        passed: severity === "normal",
      };
    });
  }

  resolveGeneralState(summaries: ParameterRuleSummary[]): RuleSeverity {
    return summaries.reduce<RuleSeverity>(
      (worst, s) => maxSeverity(worst, s.severity),
      "normal"
    );
  }

  countAlerts(summaries: ParameterRuleSummary[]): number {
    return summaries.filter((s) => s.severity !== "normal").length;
  }

  getOutOfRangeParameters(summaries: ParameterRuleSummary[]): ParameterRuleSummary[] {
    return summaries.filter((s) => !s.passed);
  }
}

export const ruleEvaluator = new RuleEvaluator();
