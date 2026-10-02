"use client";

import { useEffect, useState } from "react";

export type EnvironmentalWaterMatrix = "agua_residual" | "agua_marina";

export interface EnvironmentalModelFit {
  predictorCode: string;
  predictorLabel: string;
  n: number;
  coefficientA: number;
  coefficientB: number;
  metrics: { r2: number; rmse: number; mae: number };
  sufficientData: boolean;
}

export interface EnvironmentalModelOk {
  status: "MODEL_EVALUATED";
  matrix: EnvironmentalWaterMatrix;
  targetCode: string;
  targetLabel: string;
  n: number;
  minNPerPredictor: number;
  maxSimultaneousPredictorsAllowed: number;
  fits: EnvironmentalModelFit[];
  multivariate: { allowed: false; requiredNFor2Predictors: number; message: string };
  disclaimers: string[];
}

export interface EnvironmentalModelInsufficient {
  status: string;
  matrix: EnvironmentalWaterMatrix;
  targetCode: string;
  n: number;
  message: string;
  disclaimers: string[];
}

export type EnvironmentalModelResponse = EnvironmentalModelOk | EnvironmentalModelInsufficient;

export function isEnvironmentalModelOk(
  r: EnvironmentalModelResponse | null
): r is EnvironmentalModelOk {
  return !!r && r.status === "MODEL_EVALUATED";
}

/**
 * Hook del modelo ambiental (sin satélite) — independiente de useDrenPrediction, que consulta
 * el módulo de predicción satelital. No comparten fetch ni estado.
 */
export function useEnvironmentalModel(matrix: EnvironmentalWaterMatrix, targetCode: string) {
  const [data, setData] = useState<EnvironmentalModelResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    fetch(`/api/environmental-model?matrix=${matrix}&targetCode=${targetCode}`)
      .then((res) => res.json())
      .then((json: EnvironmentalModelResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matrix, targetCode]);

  return { data, loading };
}
