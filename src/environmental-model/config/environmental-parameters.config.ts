/**
 * Catálogo de parámetros disponibles para el "modelo ambiental" (Dren 4000, histórico
 * Nizama & Cabrera 2018) — regresión parámetro↔parámetro dentro de la MISMA muestra,
 * sin ningún dato satelital. Ver environmental-model-readiness.config.ts para los umbrales.
 *
 * Dos matrices de agua, deliberadamente separadas (nunca combinadas en un mismo modelo):
 *  - agua_residual: P1–P5, agua del propio Dren 4000 antes de llegar al mar.
 *  - agua_marina: P6–P10, agua de mar en la desembocadura/orilla — química de base distinta
 *    (salinidad, conductividad muy superior) y con nitratos/fosfatos reportados únicamente aquí.
 */

import type { EntityMeta } from "@/models/base";
import type { ParametrosFisicoquimicos } from "@/models/monitoring";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";

/** Campos numéricos medibles de una muestra — excluye metadatos e identificadores. */
export type EnvironmentalMeasurementField = Exclude<
  keyof ParametrosFisicoquimicos,
  keyof EntityMeta | "id" | "muestraId" | "estacionId"
>;

export type EnvironmentalWaterMatrix = "agua_residual" | "agua_marina";

export const AGUA_RESIDUAL_STATION_CODES: readonly string[] = ["P1", "P2", "P3", "P4", "P5"];
export const AGUA_MARINA_STATION_CODES: readonly string[] = ["P6", "P7", "P8", "P9", "P10"];

export function resolveWaterMatrix(stationCode: string): EnvironmentalWaterMatrix | null {
  if (AGUA_RESIDUAL_STATION_CODES.includes(stationCode)) return "agua_residual";
  if (AGUA_MARINA_STATION_CODES.includes(stationCode)) return "agua_marina";
  return null;
}

export interface EnvironmentalParameterDefinition {
  field: EnvironmentalMeasurementField;
  code: ParametroCodigoDb;
  label: string;
  unit: string;
}

/** Disponibles en AMBAS matrices (reportados en los 10 puntos) */
export const ENVIRONMENTAL_PARAMETERS_COMMON: EnvironmentalParameterDefinition[] = [
  { field: "temperatura", code: "temperature", label: "Temperatura", unit: "°C" },
  { field: "ph", code: "ph", label: "pH", unit: "" },
  { field: "conductividad", code: "conductivity", label: "Conductividad", unit: "µS/cm" },
  {
    field: "solidosSuspendidosTotales",
    code: "total_suspended_solids",
    label: "Sólidos Suspendidos Totales",
    unit: "mg/L",
  },
  { field: "dbo5", code: "bod5", label: "DBO5", unit: "mg/L" },
  { field: "coliformes", code: "coliforms", label: "Coliformes Totales", unit: "NMP/100mL" },
  {
    field: "coliformesTermotolerantes",
    code: "thermotolerant_coliforms",
    label: "Coliformes Termotolerantes",
    unit: "NMP/100mL",
  },
];

/** Solo reportados en agua marina (P6–P10) en la fuente original */
export const ENVIRONMENTAL_PARAMETERS_MARINE_ONLY: EnvironmentalParameterDefinition[] = [
  { field: "nitratos", code: "nitrates", label: "Nitratos", unit: "mg/L" },
  { field: "fosfatos", code: "phosphates", label: "Fosfatos", unit: "mg/L" },
];

export function getEnvironmentalParametersForMatrix(
  matrix: EnvironmentalWaterMatrix
): EnvironmentalParameterDefinition[] {
  return matrix === "agua_marina"
    ? [...ENVIRONMENTAL_PARAMETERS_COMMON, ...ENVIRONMENTAL_PARAMETERS_MARINE_ONLY]
    : ENVIRONMENTAL_PARAMETERS_COMMON;
}

export function getEnvironmentalParameterDefinition(
  matrix: EnvironmentalWaterMatrix,
  code: ParametroCodigoDb
): EnvironmentalParameterDefinition | null {
  return getEnvironmentalParametersForMatrix(matrix).find((p) => p.code === code) ?? null;
}
