/**
 * EnvironmentalModelService — el "modelo ambiental": predice un parámetro de una muestra del
 * Dren 4000 a partir de OTROS parámetros medidos en esa misma muestra, sin ningún dato
 * satelital. Reutiliza el mismo OLS y las mismas métricas (R²/RMSE/MAE) que ya usa la
 * calibración exploratoria satelital — la disciplina de "nunca fabricar, siempre reportar N"
 * es la misma en ambos módulos, aunque sean independientes entre sí.
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { RegressionMetrics } from "@/satellite/types/scientific-calibration.types";
import { fitLinearRegression, predictLinear } from "@/satellite/calibration/linear-regression";
import { computeRegressionMetrics } from "@/satellite/calibration/regression-metrics";
import {
  getEnvironmentalParameterDefinition,
  getEnvironmentalParametersForMatrix,
  type EnvironmentalWaterMatrix,
} from "./config/environmental-parameters.config";
import {
  ENV_MODEL_DISCLAIMERS,
  ENV_MODEL_MIN_N_PER_PREDICTOR,
  maxSimultaneousPredictors,
  minNRequiredForPredictors,
} from "./config/environmental-model-readiness.config";
import { getEnvironmentalRowsForMatrix } from "./environmental-dataset";

export interface EnvironmentalModelFit {
  predictorCode: ParametroCodigoDb;
  predictorLabel: string;
  n: number;
  coefficientA: number;
  coefficientB: number;
  metrics: RegressionMetrics;
  sufficientData: boolean;
}

export interface EnvironmentalModelResponse {
  status: "MODEL_EVALUATED";
  matrix: EnvironmentalWaterMatrix;
  targetCode: ParametroCodigoDb;
  targetLabel: string;
  n: number;
  minNPerPredictor: number;
  maxSimultaneousPredictorsAllowed: number;
  fits: EnvironmentalModelFit[];
  multivariate: {
    allowed: false;
    requiredNFor2Predictors: number;
    message: string;
  };
  disclaimers: string[];
}

export interface EnvironmentalModelInsufficientResponse {
  status: "INSUFFICIENT_DATA" | "UNKNOWN_PARAMETER" | "NO_CANDIDATE_PREDICTORS";
  matrix: EnvironmentalWaterMatrix;
  targetCode: ParametroCodigoDb;
  n: number;
  message: string;
  disclaimers: string[];
}

export class EnvironmentalModelError extends Error {
  readonly payload: EnvironmentalModelInsufficientResponse;
  constructor(payload: EnvironmentalModelInsufficientResponse) {
    super(payload.message);
    this.name = "EnvironmentalModelError";
    this.payload = payload;
  }
}

const BASE_DISCLAIMERS = [
  ENV_MODEL_DISCLAIMERS.notSatellite,
  ENV_MODEL_DISCLAIMERS.onlyTwoCampaigns,
  ENV_MODEL_DISCLAIMERS.pseudoReplication,
  ENV_MODEL_DISCLAIMERS.matrixSeparation,
  ENV_MODEL_DISCLAIMERS.multivariateDisabled,
  ENV_MODEL_DISCLAIMERS.exploratoryOnly,
];

export class EnvironmentalModelService {
  run(matrix: EnvironmentalWaterMatrix, targetCode: ParametroCodigoDb): EnvironmentalModelResponse {
    const targetDef = getEnvironmentalParameterDefinition(matrix, targetCode);
    if (!targetDef) {
      throw new EnvironmentalModelError({
        status: "UNKNOWN_PARAMETER",
        matrix,
        targetCode,
        n: 0,
        message: `"${targetCode}" no está disponible como parámetro objetivo en la matriz ${matrix} del dataset histórico (Nizama & Cabrera, 2018).`,
        disclaimers: BASE_DISCLAIMERS,
      });
    }

    const rows = getEnvironmentalRowsForMatrix(matrix);
    const targetRows = rows.filter((r) => r.values[targetDef.field] !== undefined);
    const n = targetRows.length;

    if (n < ENV_MODEL_MIN_N_PER_PREDICTOR) {
      throw new EnvironmentalModelError({
        status: "INSUFFICIENT_DATA",
        matrix,
        targetCode,
        n,
        message: `Solo hay N=${n} muestras reales con "${targetDef.label}" en la matriz ${matrix} — por debajo del mínimo interno (N≥${ENV_MODEL_MIN_N_PER_PREDICTOR} por predictor). No se entrena ningún modelo.`,
        disclaimers: BASE_DISCLAIMERS,
      });
    }

    const candidatePredictors = getEnvironmentalParametersForMatrix(matrix).filter(
      (p) => p.code !== targetCode
    );

    const fits: EnvironmentalModelFit[] = candidatePredictors.map((predictorDef) => {
      const pairRows = targetRows.filter((r) => r.values[predictorDef.field] !== undefined);
      const pairN = pairRows.length;
      const sufficientData = pairN >= ENV_MODEL_MIN_N_PER_PREDICTOR;

      if (!sufficientData) {
        return {
          predictorCode: predictorDef.code,
          predictorLabel: predictorDef.label,
          n: pairN,
          coefficientA: NaN,
          coefficientB: NaN,
          metrics: { r2: NaN, rmse: NaN, mae: NaN },
          sufficientData: false,
        };
      }

      const x = pairRows.map((r) => r.values[predictorDef.field] as number);
      const y = pairRows.map((r) => r.values[targetDef.field] as number);
      const coefficients = fitLinearRegression(x, y);

      if (!coefficients) {
        return {
          predictorCode: predictorDef.code,
          predictorLabel: predictorDef.label,
          n: pairN,
          coefficientA: NaN,
          coefficientB: NaN,
          metrics: { r2: NaN, rmse: NaN, mae: NaN },
          sufficientData: false,
        };
      }

      const predicted = x.map((xi) => predictLinear(coefficients, xi));
      const metrics = computeRegressionMetrics(y, predicted);

      return {
        predictorCode: predictorDef.code,
        predictorLabel: predictorDef.label,
        n: pairN,
        coefficientA: Number(coefficients.coefficientA.toFixed(6)),
        coefficientB: Number(coefficients.coefficientB.toFixed(6)),
        metrics,
        sufficientData: true,
      };
    });

    if (fits.length === 0) {
      throw new EnvironmentalModelError({
        status: "NO_CANDIDATE_PREDICTORS",
        matrix,
        targetCode,
        n,
        message: `No hay otros parámetros disponibles en la matriz ${matrix} para usar como predictor de "${targetDef.label}".`,
        disclaimers: BASE_DISCLAIMERS,
      });
    }

    const sortedFits = [...fits].sort((a, b) => {
      if (a.sufficientData !== b.sufficientData) return a.sufficientData ? -1 : 1;
      const ra = Number.isFinite(a.metrics.r2) ? a.metrics.r2 : -Infinity;
      const rb = Number.isFinite(b.metrics.r2) ? b.metrics.r2 : -Infinity;
      return rb - ra;
    });

    return {
      status: "MODEL_EVALUATED",
      matrix,
      targetCode,
      targetLabel: targetDef.label,
      n,
      minNPerPredictor: ENV_MODEL_MIN_N_PER_PREDICTOR,
      maxSimultaneousPredictorsAllowed: maxSimultaneousPredictors(n),
      fits: sortedFits,
      multivariate: {
        allowed: false,
        requiredNFor2Predictors: minNRequiredForPredictors(2),
        message: ENV_MODEL_DISCLAIMERS.multivariateDisabled,
      },
      disclaimers: BASE_DISCLAIMERS,
    };
  }
}

export const environmentalModelService = new EnvironmentalModelService();
