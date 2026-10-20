"use client";

import { useCallback, useEffect, useState } from "react";

export interface SceneSummary {
  sceneId: string;
  acquisitionDate: string;
  cloudPercentage: number | null;
}
export interface ScenesResponse {
  scenes: SceneSummary[];
  meta: { isSimulated: boolean; copernicusConnected?: boolean; copernicusLive?: boolean; message?: string };
}

export interface ObservationSummary {
  acquisitionDate: string;
  indices: Record<string, number>;
  isSimulated: boolean;
  waterFraction?: number | null;
  pixelsUsed?: number;
  waterSufficiency?: "sufficient" | "insufficient" | "unknown";
}
export interface ObservationsResponse {
  observations: ObservationSummary[];
  meta: { isSimulated: boolean; message?: string };
}

export interface PredictionOk {
  status: "PREDICTED";
  predictedValue: number;
  unit: string;
  uncertainty: { lower: number; upper: number; method: string } | null;
  observation: { provider: string; acquisitionDate: string; predictorValue: number; isSimulated: boolean };
  model: {
    trainingSampleCount: number;
    validationSampleCount: number;
    validationMetrics: { r2: number; rmse: number; mae: number };
  };
  sampleSize: { realPairs: number; acceptedRealPairs: number };
  disclaimer: string;
}
export interface PredictionLiteratureModel {
  status: "PREDICTED_LITERATURE_MODEL";
  predictedValue: number;
  unit: string;
  observation: { provider: string; acquisitionDate: string; predictorValue: number; isSimulated: boolean };
  literatureModel: {
    modelCode: string;
    citation: {
      authors: string;
      year: number;
      title: string;
      journal: string;
      volume: string;
      pages: string;
      doi: string;
    };
    calibrationContext: string;
    transferabilityWarning: string;
    formulaDescription: string;
    calibrationMetrics: { r2: number; n: number; calibratedRangeDescription: string };
  };
  localCalibration: {
    status: string;
    message: string;
    sampleSize: { realPairs: number; acceptedRealPairs: number };
  };
  disclaimer: string;
}
export interface PredictionInsufficient {
  status: string;
  message: string;
  sampleSize: {
    realPairs: number;
    acceptedRealPairs: number;
    trainingSampleCount: number | null;
    validationSampleCount: number | null;
  };
}
export type PredictionResponse = PredictionOk | PredictionLiteratureModel | PredictionInsufficient;

export interface TrendResponse {
  status: "TREND_AVAILABLE" | "INSUFFICIENT_TEMPORAL_DATA";
  points: { date: string; value: number }[];
  distinctDates: number;
  trend: { slopePerYear: number; metrics: { r2: number; rmse: number; mae: number } } | null;
  forecast: { targetDate: string; predictedValue: number; uncertainty: { lower: number; upper: number } } | null;
  reasons: string[];
  disclaimer: string;
  totalRecordsFound: number;
  simulatedRecordsExcluded: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return (await res.json()) as T;
}

export function isPredictionOk(p: PredictionResponse | null): p is PredictionOk {
  return !!p && p.status === "PREDICTED";
}

export function isPredictionLiteratureModel(
  p: PredictionResponse | null
): p is PredictionLiteratureModel {
  return !!p && p.status === "PREDICTED_LITERATURE_MODEL";
}

export function isPredictionInsufficient(p: PredictionResponse | null): p is PredictionInsufficient {
  return !!p && p.status !== "PREDICTED" && p.status !== "PREDICTED_LITERATURE_MODEL";
}

/**
 * Fuente única de la consulta de los 3 pasos (Copernicus/GEE → índices → predicción) +
 * serie histórica/proyección — compartida entre el dashboard y la página /prediccion completa,
 * para no duplicar la lógica de fetch en dos lugares.
 */
export function useDrenPrediction(stationId: string, parameterCode: string) {
  const [scenes, setScenes] = useState<ScenesResponse | null>(null);
  const [observations, setObservations] = useState<ObservationsResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setScenes(null);
    setObservations(null);
    setPrediction(null);
    setTrend(null);

    const [scenesRes, obsRes, predRes, trendRes] = await Promise.allSettled([
      fetchJson<ScenesResponse>(
        `/api/satellite/scenes?stationId=${stationId}&useCopernicus=true&usePlanetaryComputer=true`
      ),
      fetchJson<ObservationsResponse>(
        `/api/satellite/observations?stationId=${stationId}&useCopernicus=true&usePlanetaryComputer=true`
      ),
      fetchJson<PredictionResponse>(`/api/satellite/prediction?stationId=${stationId}&parameterCode=${parameterCode}`),
      fetchJson<TrendResponse>(`/api/satellite/trend?stationId=${stationId}&parameterCode=${parameterCode}`),
    ]);

    if (scenesRes.status === "fulfilled") setScenes(scenesRes.value);
    if (obsRes.status === "fulfilled") setObservations(obsRes.value);
    if (predRes.status === "fulfilled") setPrediction(predRes.value);
    if (trendRes.status === "fulfilled") setTrend(trendRes.value);
    setLoading(false);
  }, [stationId, parameterCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { scenes, observations, prediction, trend, loading, reload: load };
}
