/**
 * Los tres niveles de confianza del módulo de foto — decisión PURA (sin I/O), separada
 * deliberadamente de dónde vienen sus insumos (chequeo de conectividad, consulta satelital,
 * estado de calibración), que sí requieren red/servidor y viven en otros archivos.
 *
 * Decisión de diseño explícita (no ambigua en el código, aunque el prompt original lo dejaba
 * implícito): el Nivel 3 exige estar EN LÍNEA, porque "máxima confianza posible" requiere
 * confirmar contra el servidor el estado actual de calibración (N real, R² vigente) — no basta
 * con una copia cacheada de hace tiempo. Si el dispositivo está sin conexión pero ya tiene una
 * fórmula calibrada guardada de una sesión anterior, se usa igual (mejor que la genérica), pero
 * la etiqueta sigue siendo la de Nivel 1 ("offline — calibrada localmente"), no Nivel 3, porque
 * en ese momento no se puede verificar que siga vigente.
 */

export type PhotoConfidenceLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
export type PhotoFormulaSource = "hydrocolor_generic" | "local_lab_calibration";

export interface PhotoConfidenceInput {
  isOnline: boolean;
  /** Solo relevante offline: ¿hay una fórmula calibrada cacheada de una sesión anterior? */
  hasCachedLocalCalibration: boolean;
  /** Solo relevante online: ¿el servidor confirma que hay calibración suficiente AHORA? */
  labCalibrationSufficientNow: boolean;
  /** Solo relevante online: ¿se encontró una escena Sentinel-2 de referencia? */
  satelliteSceneFound: boolean;
}

export interface PhotoConfidenceResult {
  level: PhotoConfidenceLevel;
  formulaSource: PhotoFormulaSource;
  connectivityAtEvaluation: "online" | "offline";
  label: string;
}

const LEVEL_1_GENERIC_LABEL =
  "Estimación offline — genérica sin calibrar, sin verificación adicional.";
const LEVEL_1_CALIBRATED_LABEL =
  "Estimación offline — calibrada localmente (última calibración conocida, sin verificar vigencia), sin verificación adicional.";
const LEVEL_2_LABEL = "Estimación por foto + referencia satelital disponible para contraste.";

export function resolvePhotoConfidence(input: PhotoConfidenceInput): PhotoConfidenceResult {
  if (!input.isOnline) {
    const formulaSource: PhotoFormulaSource = input.hasCachedLocalCalibration
      ? "local_lab_calibration"
      : "hydrocolor_generic";
    return {
      level: "LEVEL_1",
      formulaSource,
      connectivityAtEvaluation: "offline",
      label: formulaSource === "local_lab_calibration" ? LEVEL_1_CALIBRATED_LABEL : LEVEL_1_GENERIC_LABEL,
    };
  }

  if (input.labCalibrationSufficientNow) {
    return {
      level: "LEVEL_3",
      formulaSource: "local_lab_calibration",
      connectivityAtEvaluation: "online",
      // Etiqueta completa (con N/R²/rango) la arma el llamador — aquí solo el nivel.
      label: "Calibrado con laboratorio",
    };
  }

  if (input.satelliteSceneFound) {
    return {
      level: "LEVEL_2",
      formulaSource: "hydrocolor_generic",
      connectivityAtEvaluation: "online",
      label: LEVEL_2_LABEL,
    };
  }

  // En línea pero sin escena satelital ni calibración suficiente: el propio prompt indica
  // que el resultado "se queda en el Nivel 1" — con conectividad, pero sin nada adicional
  // que ofrecer todavía.
  return {
    level: "LEVEL_1",
    formulaSource: "hydrocolor_generic",
    connectivityAtEvaluation: "online",
    label: LEVEL_1_GENERIC_LABEL,
  };
}
