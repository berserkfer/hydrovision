/**
 * Bloqueo duro — parámetros SIN señal óptica directa medible por Sentinel-2.
 *
 * Regla científica no negociable: pH, DQO, DBO5, nitratos, fosfatos y coliformes NO
 * tienen una relación óptica directa establecida en la literatura de teledetección de
 * calidad de agua. Pueden mostrarse como CONTEXTO (ej. junto a un índice espectral en un
 * reporte), pero NUNCA como salida de un modelo de predicción satelital.
 *
 * Este bloqueo es independiente de comparability.catalog.ts: aunque esa capa registre una
 * relación "candidata" a futuro (ej. phosphates↔NDCI, documentada como exploración de
 * literatura), esta lista tiene prioridad y corta cualquier intento de calibración/predicción
 * ANTES de evaluar readiness o ajustar un modelo.
 *
 * Referencia: no existe consenso científico de recuperación óptica directa de nutrientes
 * disueltos (fosfatos, nitratos), demanda de oxígeno (DQO/DBO5), pH o coliformes desde
 * reflectancia de superficie Sentinel-2 sin trazador óptico intermedio (ej. turbidez como
 * proxy de erosión, NO como medición directa de estos parámetros).
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";

export const NON_OPTICALLY_PLAUSIBLE_PARAMETERS: readonly ParametroCodigoDb[] = [
  "ph",
  "cod",
  "bod5",
  "nitrates",
  "phosphates",
  "coliforms",
  "thermotolerant_coliforms",
] as const;

export const NON_OPTICALLY_PLAUSIBLE_DISCLAIMER =
  "Este parámetro no tiene señal óptica directa establecida en la literatura de teledetección de calidad de agua. No se entrena ni se ejecuta ningún modelo satelital para predecirlo — puede mostrarse únicamente como contexto de campo junto a los índices espectrales." as const;

export function isOpticallyPlausibleTarget(parameterCode: ParametroCodigoDb): boolean {
  return !NON_OPTICALLY_PLAUSIBLE_PARAMETERS.includes(parameterCode);
}

/**
 * Parámetros hoy confirmados como ópticamente plausibles Y con relación candidata registrada
 * en comparability.catalog.ts. Lista deliberadamente conservadora: turbidez y sólidos
 * suspendidos totales (SST, distinto de sólidos disueltos) tienen proxy espectral directo
 * (NDTI/MNDWI) ampliamente documentado. `total_suspended_solids` se habilitó cuando llegaron
 * mediciones reales de campo (Dren 4000, 2014) — antes no existía el parámetro en el catálogo.
 * Clorofila-a sigue fuera: HydroVision no tiene mediciones de campo de clorofila-a
 * (solo existe como proxy espectral NDCI), así que no hay variable de campo que calibrar.
 */
export const OPTICALLY_PLAUSIBLE_MODELING_TARGETS: readonly ParametroCodigoDb[] = [
  "turbidity",
  "total_suspended_solids",
] as const;
