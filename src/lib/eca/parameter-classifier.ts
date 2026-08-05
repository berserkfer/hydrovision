/**
 * Clasificador ECA por parámetro — Sprint 2E
 * Reutiliza la lógica del clasificador existente.
 */

import type { ComplianceStatus } from "@/types";
import type { ParameterCode } from "@/types/parameter-management";
import { getParameterDefinition } from "@/lib/parameters/catalog";

function evaluateValue(
  value: number,
  min: number | undefined,
  max: number | undefined,
  alertRatio: number
): ComplianceStatus {
  if (min !== undefined && value < min) {
    const alertMin = min + min * (1 - alertRatio) * 0.5;
    return value >= alertMin ? "alert" : "non_compliant";
  }
  if (max !== undefined && value > max) {
    const alertMax = max * alertRatio;
    return value <= alertMax ? "alert" : "non_compliant";
  }
  return "compliant";
}

export function classifyParameterValue(code: ParameterCode, value: number): ComplianceStatus {
  const def = getParameterDefinition(code);
  return evaluateValue(value, def.ecaMin, def.ecaMax, def.alertThresholdRatio);
}

export function formatEcaLimit(code: ParameterCode): string {
  const def = getParameterDefinition(code);
  if (def.ecaMin != null && def.ecaMax != null) return `${def.ecaMin} – ${def.ecaMax}`;
  if (def.ecaMin != null) return `≥ ${def.ecaMin}`;
  if (def.ecaMax != null) return `≤ ${def.ecaMax}`;
  return "—";
}

export function interpretParameterStatus(code: ParameterCode, status: ComplianceStatus): string {
  const def = getParameterDefinition(code);
  if (status === "compliant") {
    return `${def.name} dentro del rango ECA orientativo. ${def.interpretationGuide}`;
  }
  if (status === "alert") {
    return `${def.name} próximo al límite ECA. Se recomienda seguimiento reforzado en la estación.`;
  }
  return `${def.name} fuera del límite ECA orientativo. Evaluar fuente de contaminación y repetir muestreo.`;
}
