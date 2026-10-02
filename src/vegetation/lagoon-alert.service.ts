/**
 * Evalúa si el índice de la laguna sugiere posible acumulación de algas/vegetación acuática.
 * Honestidad obligatoria: si no hay datos suficientes, nunca se arriesga una alerta falsa.
 */

export type LagoonAlertStatus = "alert" | "normal" | "insufficient_data";

export interface LagoonIndexInput {
  found: boolean;
  value?: number | null;
}

export interface LagoonAlertResult {
  status: LagoonAlertStatus;
  value: number | null;
  threshold: number;
  message: string;
}

export function evaluateLagoonVegetationAlert(
  indexResult: LagoonIndexInput,
  threshold: number
): LagoonAlertResult {
  if (!indexResult.found || indexResult.value == null) {
    return {
      status: "insufficient_data",
      value: null,
      threshold,
      message: "Sin datos suficientes para evaluar — no se emite ninguna alerta.",
    };
  }

  if (indexResult.value >= threshold) {
    return {
      status: "alert",
      value: indexResult.value,
      threshold,
      message: `NDCI (${indexResult.value.toFixed(3)}) igual o por encima del umbral configurado (${threshold.toFixed(3)}) — posible acumulación de algas/vegetación acuática, revisar mantenimiento.`,
    };
  }

  return {
    status: "normal",
    value: indexResult.value,
    threshold,
    message: `NDCI (${indexResult.value.toFixed(3)}) por debajo del umbral configurado (${threshold.toFixed(3)}).`,
  };
}
