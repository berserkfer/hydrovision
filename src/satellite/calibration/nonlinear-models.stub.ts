/**
 * Modelos no lineales (Random Forest, XGBoost, SVR) — DESHABILITADOS.
 *
 * Regla del proyecto: con el tamaño de datos real disponible (bajo, ver
 * calibration-readiness.config.ts: mínimo exploratorio 30 pares), un modelo no lineal
 * con más parámetros que una regresión lineal simple/múltiple NO es defendible — sobreajusta
 * y no generaliza. Esta capa queda preparada para cuando N crezca lo suficiente, pero
 * NUNCA se ejecuta automáticamente: `evaluateNonlinearEligibility` es la única puerta de
 * entrada y hoy siempre retorna "insufficient_data" salvo que N ≥ 10× el número de
 * predictores (regla mínima, no garantía de que el modelo sea apropiado).
 *
 * NO IMPLEMENTAR random forest/XGBoost/SVR reales hasta que:
 *   1. evaluateNonlinearEligibility() retorne eligible=true con datos reales, Y
 *   2. Se agregue una librería de ML explícita a package.json (ninguna está instalada hoy), Y
 *   3. Se documente el mismo régimen de split temporal + reporte de R²/RMSE/MAE que ya
 *      exige exploratory-calibration.ts para regresión lineal.
 */

export type NonlinearModelKind = "random_forest" | "xgboost" | "svr";

export const NONLINEAR_MODELS_STATUS = "disabled" as const;

/** Regla mínima: N ≥ 10 × número de predictores. Necesaria, no suficiente. */
export const MIN_SAMPLES_PER_PREDICTOR_FOR_NONLINEAR = 10;

export interface NonlinearEligibilityResult {
  eligible: boolean;
  status: "disabled" | "insufficient_data";
  requiredSamples: number;
  availableSamples: number;
  predictorCount: number;
  message: string;
}

/**
 * Evalúa (sin entrenar nada) si N justificaría intentar un modelo no lineal.
 * Incluso si eligible=true, el status permanece "disabled": esta función es informativa,
 * NO habilita ejecución. Ningún modelo no lineal está implementado en este repositorio.
 */
export function evaluateNonlinearEligibility(
  availableSamples: number,
  predictorCount: number
): NonlinearEligibilityResult {
  const requiredSamples = MIN_SAMPLES_PER_PREDICTOR_FOR_NONLINEAR * Math.max(predictorCount, 1);
  const meetsRule = availableSamples >= requiredSamples;

  return {
    eligible: false,
    status: "disabled",
    requiredSamples,
    availableSamples,
    predictorCount,
    message: meetsRule
      ? `N=${availableSamples} cumpliría la regla N≥10×predictores (requerido ${requiredSamples}), pero los modelos no lineales (Random Forest/XGBoost/SVR) NO están implementados en este repositorio. Solo regresión lineal disponible.`
      : `Datos insuficientes para modelos no lineales: N=${availableSamples} < requerido ${requiredSamples} (10× ${predictorCount} predictor(es)). Solo regresión lineal disponible.`,
  };
}
