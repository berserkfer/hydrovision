/**
 * Criterios técnicos internos para decidir si vale la pena explorar calibración.
 * minimum exploratory readiness criteria — NO estándares científicos universales.
 */

export const MIN_EXPLORATORY_READINESS_DISCLAIMER =
  "Estos umbrales son criterios técnicos internos (minimum exploratory readiness criteria) para decidir si vale la pena intentar una calibración exploratoria. No constituyen estándares científicos universales." as const;

export const MIN_EXPLORATORY_READINESS = {
  /** Pares reales mínimos para exploración simple */
  minRealPairs: 30,
  /** Estaciones distintas con datos reales */
  minStations: 3,
  /** Periodos temporales independientes (meses distintos con datos) */
  minIndependentTemporalPeriods: 2,
  /** Fracción máxima de pares atribuibles a una sola estación */
  maxSingleStationShare: 0.8,
  /** Tamaño mínimo del conjunto de validación temporal */
  minValidationSetSize: 5,
  /** Tamaño mínimo del conjunto de entrenamiento temporal */
  minTrainingSetSize: 15,
  /** Proporción objetivo entrenamiento (solo si no deja grupos demasiado pequeños) */
  targetTrainingFraction: 0.7,
} as const;

export const CALIBRATION_SCIENTIFIC_DISCLAIMERS = {
  exploratory:
    "Esta calibración es exploratoria y depende de la calidad, cantidad, distribución temporal y espacial de los datos disponibles. Los resultados no constituyen una validación universal del índice espectral ni una equivalencia física con el parámetro de campo.",
  r2:
    "Un R² elevado no demuestra causalidad ni garantiza generalización fuera del conjunto de validación.",
  calibratedEstimate:
    "Valor estimado mediante calibración exploratoria — no equivalencia directa índice ↔ parámetro de campo.",
} as const;
