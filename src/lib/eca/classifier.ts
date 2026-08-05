import { ECA_STANDARDS } from "./standards";
import type { ComplianceResult, FieldMeasurement, WaterParameter } from "@/types";

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
