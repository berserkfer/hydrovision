/**
 * Modelos de referencia bibliográfica — ecuaciones YA publicadas y citadas (peer-reviewed),
 * NO calibradas con datos de Dren 4000. Se usan como estimación externa ilustrativa cuando
 * la calibración local exploratoria es insuficiente (ver calibration-readiness.config.ts).
 *
 * Regla no negociable: cada coeficiente numérico aquí debe provenir de un artículo verificado
 * (fuente primaria leída, no un resumen de búsqueda) — nunca de una aproximación o "valor
 * plausible". Si no existe un modelo verificado para un parámetro, NO se agrega ninguno — se
 * mantiene el estado honesto de "insuficiente" en vez de fabricar un modelo.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { Sentinel2BandCode } from "../catalog/sentinel2-bands.catalog";

export interface LiteratureModelCitation {
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume: string;
  pages: string;
  doi: string;
}

export interface LiteratureModelCalibrationMetrics {
  /** R² reportado en el artículo original, para la banda/subset usado aquí */
  r2: number;
  /** N de la calibración original (NO de Dren 4000) */
  n: number;
  calibratedRangeDescription: string;
}

export interface LiteratureModelDefinition {
  code: string;
  parameterCode: ParametroCodigoDb;
  name: string;
  requiredBand: Sentinel2BandCode;
  unit: string;
  citation: LiteratureModelCitation;
  calibrationContext: string;
  transferabilityWarning: string;
  formulaDescription: string;
  calibrationMetrics: LiteratureModelCalibrationMetrics;
  /** Retorna null si la reflectancia está fuera del régimen válido del modelo — nunca extrapola a ciegas */
  compute: (reflectance: number) => number | null;
}

export interface LiteratureModelEstimate {
  modelCode: string;
  parameterCode: ParametroCodigoDb;
  predictedValue: number;
  unit: string;
  inputBand: Sentinel2BandCode;
  inputReflectance: number;
  citation: LiteratureModelCitation;
  calibrationContext: string;
  transferabilityWarning: string;
  formulaDescription: string;
  calibrationMetrics: LiteratureModelCalibrationMetrics;
  disclaimer: string;
}
