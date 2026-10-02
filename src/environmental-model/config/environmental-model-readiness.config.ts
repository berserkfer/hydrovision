/**
 * Umbrales y advertencias del "modelo ambiental" — regla ya establecida en el proyecto:
 * solo regresión lineal, y solo si N ≥ 10 × número de predictores. Con el dataset histórico
 * (Nizama & Cabrera, 2018) el N por matriz de agua es fijo en 10 (5 puntos × 2 campañas), así
 * que el propio umbral solo permite UN predictor a la vez — nunca un modelo multivariante.
 */

export const ENV_MODEL_MIN_N_PER_PREDICTOR = 10;

/** Con N por matriz = 10, floor(10/10) = 1 — nunca alcanza para 2+ predictores simultáneos. */
export function maxSimultaneousPredictors(n: number): number {
  return Math.floor(n / ENV_MODEL_MIN_N_PER_PREDICTOR);
}

export function minNRequiredForPredictors(predictorCount: number): number {
  return predictorCount * ENV_MODEL_MIN_N_PER_PREDICTOR;
}

export const ENV_MODEL_DISCLAIMERS = {
  notSatellite:
    "Este es el modelo ambiental (sin satélite): predice un parámetro de la muestra a partir de OTROS parámetros medidos en esa misma muestra. Es independiente del módulo de predicción satelital (Sentinel-2 + SST/Nechad) — no comparte datos, entrenamiento ni resultados con él.",
  onlyTwoCampaigns:
    "Los datos provienen de solo 2 campañas (marzo y setiembre de 2014). Esto NO es una serie temporal ni permite hablar de una tendencia estacional o anual — son dos fotografías puntuales del mismo conjunto de puntos.",
  pseudoReplication:
    "Advertencia estadística: cada matriz de agua tiene 5 ubicaciones físicas medidas 2 veces cada una (N=10), no 10 ubicaciones independientes. Esta pseudo-réplica reduce la variabilidad real capturada por el modelo por debajo de lo que sugiere el N nominal.",
  matrixSeparation:
    "Agua residual (P1–P5, dentro del Dren 4000) y agua marina (P6–P10, en la desembocadura/orilla) son matrices físico-químicas distintas — con salinidad y conductividad de base muy diferentes. Nunca se combinan en un mismo modelo.",
  multivariateDisabled:
    "Un modelo con 2 o más parámetros simultáneos (multivariante) requeriría N ≥ 20 (para 2 predictores) según el criterio interno del proyecto (N ≥ 10 × predictores). Con N=10 por matriz, esa combinación está deshabilitada — solo se ejecutan regresiones de un único predictor a la vez.",
  exploratoryOnly:
    "Resultado exploratorio de una fuente externa publicada (Nizama & Cabrera, 2018), no una calibración propia de HydroVision. Un R² alto aquí no implica causalidad ni generalización a otras fechas o condiciones del Dren 4000.",
} as const;
