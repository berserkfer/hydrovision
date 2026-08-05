/**
 * Utilidades para generar datos simulados del explorador
 */

import type { SatelliteImage } from "../interfaces/satellite-image.interface";
import type { SatellitePlatform, SatelliteSearchQuery } from "../types/satellite-explorer.types";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function buildSimulatedThumbnail(platform: SatellitePlatform, cloudCover: number): string {
  const base =
    platform === "sentinel2" ? "#0ea5e9" : platform === "landsat8" ? "#6366f1" : "#8b5cf6";
  const cloud = Math.min(cloudCover / 100, 0.85);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">
    <rect width="120" height="90" fill="${base}" opacity="0.35"/>
    <rect width="120" height="90" fill="url(#g)" opacity="0.8"/>
    <rect x="0" y="0" width="120" height="${Math.round(90 * cloud)}" fill="#f8fafc" opacity="0.55"/>
    <text x="8" y="82" fill="#0f172a" font-size="9" font-family="monospace">${platform}</text>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#065f46"/>
        <stop offset="50%" stop-color="#0891b2"/>
        <stop offset="100%" stop-color="#1e3a5f"/>
      </linearGradient>
    </defs>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function enumerateDates(start: string, end: string, stepDays: number): Date[] {
  const dates: Date[] = [];
  const current = new Date(`${start}T12:00:00.000Z`);
  const limit = new Date(`${end}T12:00:00.000Z`);

  while (current <= limit) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + stepDays);
  }

  return dates;
}

function resolveStatus(cloudCover: number): SatelliteImage["status"] {
  if (cloudCover > 35) return "cloudy";
  if (cloudCover > 20) return "available";
  return "available";
}

export function generateMockSatelliteImages(
  query: SatelliteSearchQuery,
  center: { latitude: number; longitude: number }
): SatelliteImage[] {
  const stepDays = query.satellite === "sentinel2" ? 5 : 16;
  const dates = enumerateDates(query.startDate, query.endDate, stepDays).slice(-8);

  const delta = 0.06;

  return dates.map((date, index) => {
    const cloudCover = Math.round((index * 7 + 6) % 38);
    const iso = date.toISOString();

    return {
      id: `mock-${query.satellite}-${query.riverId}-${iso.slice(0, 10)}`,
      platform: query.satellite,
      acquiredAt: iso,
      cloudCoverPercent: cloudCover,
      status: resolveStatus(cloudCover),
      thumbnailUrl: buildSimulatedThumbnail(query.satellite, cloudCover),
      previewUrl: buildSimulatedThumbnail(query.satellite, cloudCover),
      bounds: {
        southWest: [center.latitude - delta, center.longitude - delta],
        northEast: [center.latitude + delta, center.longitude + delta],
      },
      watershedId: query.watershedId,
      riverId: query.riverId,
      stationId: query.stationId,
    };
  });
}

export function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatStatusLabel(status: SatelliteImage["status"]): string {
  const labels: Record<SatelliteImage["status"], string> = {
    available: "Disponible",
    processing: "Procesando",
    cloudy: "Nublado",
    unavailable: "No disponible",
  };
  return labels[status];
}
