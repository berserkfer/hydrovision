/**
 * HistoricalSeries — genera y filtra series históricas simuladas por estación y parámetro.
 */

import { getDataStore } from "@/data/store-access";
import { formatShortDate } from "@/utils/date.utils";
import type { HistoricalSeriesData, TemporalDataPoint, TemporalParameterKey } from "@/types/temporal";
import { getTemporalParameterConfig } from "./temporal.constants";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseDate(iso: string): Date {
  return new Date(`${iso}T12:00:00-05:00`);
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 7);
  }

  if (dates.length === 0 || dates[dates.length - 1] !== endDate) {
    dates.push(endDate);
  }

  return dates;
}

function getBaseValue(stationId: string, parameter: TemporalParameterKey): number {
  const params = getDataStore().parametros.find((p) => p.estacionId === stationId);
  const stationIndex = getDataStore().estaciones.findIndex((e) => e.id === stationId);

  if (!params) return 0;

  switch (parameter) {
    case "ph":
      return params.ph;
    case "temperatura":
      return params.temperatura;
    case "conductividad":
      return params.conductividad;
    case "oxigenoDisuelto":
      return params.oxigenoDisuelto;
    case "turbidez":
      return params.turbidez;
    case "solidosDisueltos":
      return params.solidosDisueltosTotales;
    case "caudal":
      return params.caudal ?? Number((2.5 + stationIndex * 1.8).toFixed(2));
    default:
      return 0;
  }
}

function generatePointValue(
  base: number,
  stationId: string,
  parameter: TemporalParameterKey,
  date: string,
  index: number,
  variance: number,
  decimals: number
): number {
  const seed = hashSeed(`${stationId}-${parameter}-${date}`);
  const noise = ((seed % 1000) / 1000 - 0.5) * variance * 2;
  const trendFactor = parameter === "turbidez" || parameter === "conductividad" ? 0.08 : -0.04;
  const trend = index * variance * trendFactor;
  const raw = base + noise + trend;
  return Number(raw.toFixed(decimals));
}

export class HistoricalSeries {
  build(
    stationId: string,
    stationName: string,
    parameter: TemporalParameterKey,
    startDate: string,
    endDate: string
  ): HistoricalSeriesData {
    const config = getTemporalParameterConfig(parameter);
    const base = getBaseValue(stationId, parameter);
    const dates = enumerateDates(startDate, endDate);

    const points: TemporalDataPoint[] = dates.map((date, index) => ({
      date,
      value: generatePointValue(
        base,
        stationId,
        parameter,
        date,
        index,
        config.variance,
        config.decimals
      ),
      label: formatShortDate(date),
    }));

    return {
      stationId,
      stationName,
      parameter,
      parameterLabel: config.label,
      unit: config.unit,
      startDate,
      endDate,
      points,
      isSimulated: true,
    };
  }

  /** Calcula el periodo anterior de igual duración */
  resolvePreviousRange(startDate: string, endDate: string): { start: string; end: string } {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const durationMs = end.getTime() - start.getTime();

    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return {
      start: formatDateISO(prevStart),
      end: formatDateISO(prevEnd),
    };
  }
}

export const historicalSeries = new HistoricalSeries();
