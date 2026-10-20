/**
 * Evaluación de una medición contra un perfil normativo (ECA o LMP).
 *
 * Regla de alerta: se marca "alert" cuando el valor está dentro del 10 % del
 * límite (por debajo del máximo o por encima del mínimo). Es una banda de
 * seguimiento, no un incumplimiento.
 */

import type { FieldMeasurement } from "@/types";
import { parameterLabel } from "./catalog";
import type {
  NormativeEvaluation,
  NormativeLimit,
  NormativeParameter,
  NormativeProfileDefinition,
  ParameterEvaluation,
  ParameterStatus,
} from "./types";

export const ALERT_MARGIN = 0.1;

interface ExtractedValue {
  value: number | null;
  note?: string;
}

function extractValue(
  measurement: FieldMeasurement,
  parameter: NormativeParameter
): ExtractedValue {
  switch (parameter) {
    case "ph":
      return { value: measurement.ph ?? null };
    case "conductivity":
      return { value: measurement.conductivity ?? null };
    case "dissolvedOxygen":
      return { value: measurement.dissolvedOxygen ?? null };
    case "temperature":
      return { value: measurement.temperature ?? null };
    case "bod5":
      return { value: measurement.bod5 ?? null };
    case "cod":
      return { value: measurement.cod ?? null };
    case "totalSuspendedSolids":
      return { value: measurement.totalSuspendedSolids ?? null };
    case "nitrates":
      return { value: measurement.nitrates ?? null };
    case "phosphates":
      return { value: measurement.phosphates ?? null };
    case "fatsOils":
      return { value: measurement.fatsOils ?? null };
    case "thermotolerantColiforms":
      if (measurement.thermotolerantColiforms != null) {
        return { value: measurement.thermotolerantColiforms };
      }
      if (measurement.coliforms != null) {
        return {
          value: measurement.coliforms,
          note: "Se usaron coliformes totales como aproximación; el límite normativo es para coliformes termotolerantes.",
        };
      }
      return { value: null };
    default:
      return { value: null };
  }
}

function evaluateValue(value: number, limit: NormativeLimit): ParameterStatus {
  const { min, max } = limit;

  if (min !== undefined && max !== undefined) {
    if (value < min || value > max) return "non_compliant";
    // La banda de alerta se calcula sobre el ancho del rango, no sobre el
    // valor mínimo: en pH, un 10 % de 6,5 sería 0,65 y marcaría como alerta
    // valores centrales del rango.
    const margin = (max - min) * ALERT_MARGIN;
    if (value <= min + margin || value >= max - margin) return "alert";
    return "compliant";
  }

  if (max !== undefined) {
    if (value > max) return "non_compliant";
    if (value >= max * (1 - ALERT_MARGIN)) return "alert";
    return "compliant";
  }

  if (min !== undefined) {
    if (value < min) return "non_compliant";
    if (value <= min * (1 + ALERT_MARGIN)) return "alert";
    return "compliant";
  }

  return "not_applicable";
}

export function evaluateLimit(
  measurement: FieldMeasurement,
  limit: NormativeLimit
): ParameterEvaluation {
  const extracted = extractValue(measurement, limit.parameter);
  const notes = [extracted.note, limit.note].filter(Boolean).join(" ").trim();

  if (limit.pendingVerification) {
    return {
      parameter: limit.parameter,
      label: parameterLabel(limit.parameter),
      unit: limit.unit,
      value: extracted.value,
      status: "not_applicable",
      min: limit.min,
      max: limit.max,
      source: limit.source,
      note: notes || "Límite pendiente de verificación contra la norma.",
    };
  }

  if (extracted.value === null || !Number.isFinite(extracted.value)) {
    return {
      parameter: limit.parameter,
      label: parameterLabel(limit.parameter),
      unit: limit.unit,
      value: null,
      status: "not_measured",
      min: limit.min,
      max: limit.max,
      source: limit.source,
      note: notes || undefined,
    };
  }

  return {
    parameter: limit.parameter,
    label: parameterLabel(limit.parameter),
    unit: limit.unit,
    value: extracted.value,
    status: evaluateValue(extracted.value, limit),
    min: limit.min,
    max: limit.max,
    source: limit.source,
    note: notes || undefined,
  };
}

export function evaluateNormative(
  measurement: FieldMeasurement,
  profile: NormativeProfileDefinition
): NormativeEvaluation {
  const parameters = profile.limits.map((limit) => evaluateLimit(measurement, limit));

  const violations = parameters.filter((p) => p.status === "non_compliant");
  const alerts = parameters.filter((p) => p.status === "alert");
  const evaluatedCount = parameters.filter(
    (p) => p.status === "compliant" || p.status === "alert" || p.status === "non_compliant"
  ).length;

  const status: NormativeEvaluation["status"] =
    violations.length > 0
      ? "non_compliant"
      : alerts.length > 0
        ? "alert"
        : evaluatedCount > 0
          ? "compliant"
          : "insufficient_data";

  const notes: string[] = [];
  if (profile.instrument === "ECA") {
    notes.push(
      "El ECA se aplica al cuerpo de agua receptor; no es un límite de efluente."
    );
  } else {
    notes.push("El LMP se aplica al efluente en su punto de descarga.");
  }
  if (parameters.some((p) => p.status === "not_applicable")) {
    notes.push(
      "Hay parámetros sin límite comparable en este perfil; se reportan como no aplicables, no como cumplimiento."
    );
  }

  return {
    profile,
    status,
    parameters,
    violations,
    alerts,
    evaluatedCount,
    notes,
  };
}
