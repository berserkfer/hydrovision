/**
 * Planificador de campañas — servicio.
 *
 * Combina el patrón reciente de adquisiciones Sentinel-2 sobre una estación con
 * el pronóstico de nubosidad de Open-Meteo. No consulta una efeméride orbital:
 * proyecta el ciclo observado y lo declara como estimación.
 */

import { getDataStore } from "@/data/store-access";
import { searchSentinel2Items } from "@/server/planetary/pc-stac.client";
import {
  buildOpportunity,
  projectFutureOverpasses,
  type OpportunityCandidate,
} from "@/satellite/opportunities/overpass";

const HISTORY_DAYS = 60;
const FORECAST_DAYS = 14;
export const DEFAULT_HORIZON_DAYS = 14;

const DISCLAIMER =
  "Fechas estimadas a partir del patrón reciente de adquisiciones Sentinel-2 sobre el punto, no de una efeméride orbital oficial. La nubosidad proviene del pronóstico de Open-Meteo y puede cambiar.";

export interface CampaignOpportunitiesResult {
  station: {
    id: string;
    codigo: string;
    nombre: string;
    latitude: number;
    longitude: number;
  };
  today: string;
  opportunities: OpportunityCandidate[];
  historyScenes: number;
  disclaimer: string;
}

function isoOffset(days: number, base = new Date()): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fetchCloudForecast(
  latitude: number,
  longitude: number
): Promise<Map<string, number | null>> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&daily=cloud_cover_mean&forecast_days=${FORECAST_DAYS}&timezone=America%2FLima`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return new Map();

    const data = (await response.json()) as {
      daily?: { time?: string[]; cloud_cover_mean?: Array<number | null> };
    };
    const times = data.daily?.time ?? [];
    const clouds = data.daily?.cloud_cover_mean ?? [];
    const map = new Map<string, number | null>();
    times.forEach((date, i) => {
      const value = clouds[i];
      map.set(date, typeof value === "number" ? value : null);
    });
    return map;
  } catch {
    return new Map();
  }
}

export async function getCampaignOpportunities(
  stationId: string,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
  todayOverride?: string
): Promise<CampaignOpportunitiesResult | null> {
  const store = getDataStore();
  const station =
    store.estaciones.find((e) => e.id === stationId) ??
    store.estaciones.find((e) => e.codigo.toLowerCase() === stationId.toLowerCase());

  if (!station) return null;

  const { latitude, longitude } = station.coordenadas;
  const today = todayOverride ?? isoOffset(0);
  const startDate = isoOffset(-HISTORY_DAYS, new Date(`${today}T00:00:00Z`));

  let historyScenes = 0;
  let acquisitionDates: string[] = [];

  try {
    const items = await searchSentinel2Items({
      latitude,
      longitude,
      startDate,
      endDate: today,
      cloudCoverMax: 100,
      limit: 100,
    });
    historyScenes = items.length;
    acquisitionDates = items.map((item) => item.properties.datetime);
  } catch {
    acquisitionDates = [];
  }

  const projected = projectFutureOverpasses(acquisitionDates, {
    today,
    horizonDays,
  });

  const forecast = await fetchCloudForecast(latitude, longitude);
  const opportunities = projected.map((overpass) =>
    buildOpportunity(overpass, forecast.get(overpass.date) ?? null)
  );

  return {
    station: {
      id: station.id,
      codigo: station.codigo,
      nombre: station.nombre,
      latitude,
      longitude,
    },
    today,
    opportunities,
    historyScenes,
    disclaimer: DISCLAIMER,
  };
}
