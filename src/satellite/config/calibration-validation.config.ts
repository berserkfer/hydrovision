/**
 * Criterios técnicos internos para validación exploratoria post-calibración.
 * minimum exploratory validation criteria — NO estándares científicos universales.
 */

export const MIN_EXPLORATORY_VALIDATION_DISCLAIMER =
  "Estos umbrales son criterios técnicos internos (minimum exploratory validation criteria) para evaluar consistencia exploratoria. No constituyen validación científica definitiva ni estándares universales." as const;

export const MIN_EXPLORATORY_VALIDATION = {
  /** Pares mínimos en conjunto de validation */
  minValidationPairs: 5,
  /** Pares mínimos en conjunto de training */
  minTrainingPairs: 15,
  /** Estaciones mínimas representadas */
  minStations: 2,
  /** Periodos temporales independientes mínimos en validation */
  minValidationTemporalPeriods: 1,
  /** Gap R² training−validation que activa señal de posible overfitting */
  maxR2GapWarning: 0.3,
  /** Ratio MAE validation/training que activa advertencia */
  maxMaeRatioWarning: 2.0,
  /** Ratio RMSE validation/training que activa advertencia */
  maxRmseRatioWarning: 2.0,
  /** Fracción máxima de pares en una estación */
  maxSingleStationShare: 0.8,
  /** Diferencia temporal campo-satélite elevada (días) */
  elevatedTemporalDiffDays: 5,
} as const;

export const CALIBRATION_VALIDATION_DISCLAIMERS = {
  validatedExploratory:
    "VALIDATED_EXPLORATORY indica consistencia exploratoria básica — NO implica modelo productivo, generalizable, causal ni validación científica definitiva.",
  notScientificallyValidated:
    "Este resultado NO equivale a validación científica definitiva, equivalencia física, causalidad ni precisión operacional.",
  possibleOverfitting:
    "Se detectó una señal posible de overfitting (possible_overfitting_signal) — diferencia notable entre métricas de training y validation. No afirma overfitting confirmado.",
  r2:
    "Un R² elevado no demuestra causalidad ni garantiza generalización fuera del conjunto de validación.",
} as const;
