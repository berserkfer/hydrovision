/**
 * RuleRepository — acceso a reglas configurables.
 * Preparado para carga desde PostgreSQL en fases futuras.
 */

import type { Rule, RuleParameterKey } from "@/types/rules";
import { DEFAULT_ENVIRONMENTAL_RULES } from "./rule.definitions";

export class RuleRepository {
  private rules: Rule[];

  constructor(initialRules: Rule[] = DEFAULT_ENVIRONMENTAL_RULES) {
    this.rules = initialRules.map((r) => ({ ...r }));
  }

  getAll(): Rule[] {
    return this.rules.map((r) => ({ ...r }));
  }

  getEnabled(): Rule[] {
    return this.getAll().filter((r) => r.enabled);
  }

  getById(id: string): Rule | undefined {
    return this.rules.find((r) => r.id === id);
  }

  getByParameter(parameter: RuleParameterKey): Rule[] {
    return this.getEnabled().filter((r) => r.parameter === parameter);
  }

  /** Futuro: reemplazar catálogo desde base de datos */
  loadFromDatabase(rules: Rule[]): void {
    this.rules = rules.map((r) => ({ ...r, source: "database" }));
  }

  setRuleEnabled(id: string, enabled: boolean): void {
    this.rules = this.rules.map((r) => (r.id === id ? { ...r, enabled } : r));
  }
}

export const ruleRepository = new RuleRepository();
