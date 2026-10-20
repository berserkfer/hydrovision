import { ECA_STANDARDS } from "./standards";
import {
  evaluateNormative,
  resolveProfileForPointType,
  type MonitoringPointType,
  type NormativeEvaluation,
  type NormativeParameter,
  type NormativeProfileDefinition,
} from "@/lib/normative";
import type { ComplianceResult, FieldMeasurement, WaterParameter } from "@/types";

/**
 * Correspondencia entre los parámetros con límite normativo y el subconjunto
 * histórico de `WaterParameter`. Los parámetros que no existen en ese tipo
 * (SST, nitratos, fosfatos, aceites y grasas) se consultan en el resultado
 * detallado de `evaluateNormative`, no en `ComplianceResult`.
 */
const NORMATIVE_TO_WATER: Partial<Record<NormativeParameter, WaterParameter>> = {
  ph: "ph",
  conductivity: "conductivity",
  dissolvedOxygen: "dissolvedOxygen",
  temperature: "temperature",
  bod5: "bod5",
  cod: "cod",
  thermotolerantColiforms: "coliforms",
};

function getValue(measurement: FieldMeasurement, parameter: WaterParameter): number | undefined {
  const value = measurement[parameter];
  return typeof value === "number" ? value : undefined;
}

function evaluateParameter(
  value: number,
  min: number | undefined,
  max: number | undefined,
  alertRatio: number
): "compliant" | "alert" | "non_compliant" {
  if (min !== undefined && value < min) {
    const alertMin = min + (min * (1 - alertRatio) * 0.5);
    return value >= alertMin ? "alert" : "non_compliant";
  }
  if (max !== undefined && value > max) {
    const alertMax = max * alertRatio;
    return value <= alertMax ? "alert" : "non_compliant";
  }
  return "compliant";
}

export function classifyMeasurement(measurement: FieldMeasurement): ComplianceResult {
  const violatedParameters: WaterParameter[] = [];
  const alertParameters: WaterParameter[] = [];

  for (const standard of ECA_STANDARDS) {
    const value = getValue(measurement, standard.parameter);
    if (value === undefined) continue;

    const result = evaluateParameter(
      value,
      standard.min,
      standard.max,
      standard.alertThresholdRatio
    );

    if (result === "non_compliant") violatedParameters.push(standard.parameter);
    if (result === "alert") alertParameters.push(standard.parameter);
  }

  let status: ComplianceResult["status"] = "compliant";
  if (violatedParameters.length > 0) status = "non_compliant";
  else if (alertParameters.length > 0) status = "alert";

  return { status, violatedParameters, alertParameters };
}

export function getComplianceLabel(status: ComplianceResult["status"]): string {
  const labels = {
    compliant: "Cumple ECA",
    alert: "En alerta",
    non_compliant: "No cumple",
  };
  return labels[status];
}

/**
 * Evaluación normativa completa (ECA o LMP) para un perfil concreto.
 * Devuelve el detalle por parámetro, incluyendo los que no existen en
 * `WaterParameter` (SST, nitratos, fosfatos, aceites y grasas).
 */
export function classifyMeasurementAgainstProfile(
  measurement: FieldMeasurement,
  profile: NormativeProfileDefinition
): NormativeEvaluation {
  return evaluateNormative(measurement, profile);
}

/** Resuelve el perfil por tipo de punto y evalúa. */
export function classifyForPointType(
  measurement: FieldMeasurement,
  pointType: MonitoringPointType
): NormativeEvaluation {
  return evaluateNormative(measurement, resolveProfileForPointType(pointType));
}

/**
 * Adaptador al contrato histórico `ComplianceResult`.
 * `insufficient_data` se reporta como "compliant" con listas vacías, igual que
 * el comportamiento previo ante mediciones sin parámetros evaluables.
 */
export function toComplianceResult(evaluation: NormativeEvaluation): ComplianceResult {
  const violatedParameters = evaluation.violations
    .map((p) => NORMATIVE_TO_WATER[p.parameter])
    .filter((p): p is WaterParameter => p !== undefined);
  const alertParameters = evaluation.alerts
    .map((p) => NORMATIVE_TO_WATER[p.parameter])
    .filter((p): p is WaterParameter => p !== undefined);

  const status: ComplianceResult["status"] =
    evaluation.status === "non_compliant"
      ? "non_compliant"
      : evaluation.status === "alert"
        ? "alert"
        : "compliant";

  return { status, violatedParameters, alertParameters };
}
