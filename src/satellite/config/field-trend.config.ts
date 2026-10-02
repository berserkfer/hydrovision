/**
 * Umbrales mínimos para tendencia temporal de campo (valor ~ tiempo).
 * Deliberadamente estrictos: 2 fechas "ajustan" una recta perfecta (R²=1) sin significar nada.
 */
export const MIN_TREND_DISTINCT_DATES = 3;
export const MIN_TREND_POINTS = 4;

/** Horizonte máximo de proyección — extrapolar más allá es cada vez menos defendible */
export const MAX_TREND_FORECAST_HORIZON_DAYS = 180;

export const FIELD_TREND_DISCLAIMER: string =
  "Tendencia ajustada por regresión lineal simple (valor ~ tiempo) sobre mediciones de campo reales. " +
  "Una tendencia histórica NO garantiza que el comportamiento futuro sea lineal — factores estacionales, " +
  "operativos o de gestión pueden cambiar la trayectoria sin aviso. La proyección a futuro es una " +
  "extrapolación, más riesgosa que interpolar entre fechas observadas, y se limita a un horizonte corto.";
