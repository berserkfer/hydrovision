/**
 * La vegetación/clorofila cambia más lento que la turbidez del agua — margen temporal mayor
 * que el usado para la referencia satelital del módulo de foto (±5 días).
 */
export const VEGETATION_MAX_DAYS_DIFFERENCE = 10;
export const VEGETATION_MAX_CLOUD_PERCENTAGE = 40;

/**
 * Umbral de alerta por defecto para NDCI en la laguna — punto de partida razonable, NO un
 * valor validado con muestreos de campo locales (no existen todavía). El usuario puede y debe
 * ajustarlo desde la interfaz; nunca se presenta como un límite normativo (ECA) ni calibrado.
 */
export const DEFAULT_LAGOON_ALERT_THRESHOLD = 0.4;
