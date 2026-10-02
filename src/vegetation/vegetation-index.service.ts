/**
 * Índice de vegetación/clorofila por zona — reutiliza el mismo planetaryAdapter y el mismo
 * catálogo de índices espectrales que el resto de la plataforma (predicción satelital, módulo
 * de foto). Solo cambia el punto geográfico de análisis (VEGETATION_ZONES) y el índice
 * (NDVI para tierra, NDCI para agua) — nunca se mezclan los dos usos en un mismo número.
 */

import { planetaryAdapter } from "@/server/planetary/planetary.adapter";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";
import {
  getVegetationZone,
  type VegetationZoneId,
} from "./config/vegetation-zones.config";
import {
  VEGETATION_MAX_CLOUD_PERCENTAGE,
  VEGETATION_MAX_DAYS_DIFFERENCE,
} from "./config/vegetation-alert.config";

export interface VegetationIndexResult {
  zoneId: VegetationZoneId;
  index: "NDVI" | "NDCI";
  found: boolean;
  sceneId?: string;
  acquisitionDate?: string;
  cloudPercentage?: number | null;
  daysFromReference?: number;
  value?: number | null;
  message: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

export async function getVegetationIndexForZone(
  zoneId: VegetationZoneId,
  referenceDateIso: string
): Promise<VegetationIndexResult> {
  const zone = getVegetationZone(zoneId);
  const refDate = new Date(referenceDateIso);

  if (Number.isNaN(refDate.getTime())) {
    return { zoneId, index: zone.index, found: false, message: "Fecha de referencia inválida." };
  }

  const startDate = new Date(refDate.getTime() - VEGETATION_MAX_DAYS_DIFFERENCE * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const endDate = new Date(refDate.getTime() + VEGETATION_MAX_DAYS_DIFFERENCE * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const scenes = await planetaryAdapter.searchSentinel2Scenes({
    latitude: zone.centroid.latitude,
    longitude: zone.centroid.longitude,
    startDate,
    endDate,
    cloudCoverMax: VEGETATION_MAX_CLOUD_PERCENTAGE,
    limit: 5,
  });

  if (scenes.length === 0) {
    return {
      zoneId,
      index: zone.index,
      found: false,
      message: `Sin datos suficientes para evaluar — no hay escenas Sentinel-2 dentro de ±${VEGETATION_MAX_DAYS_DIFFERENCE} días y nubosidad ≤${VEGETATION_MAX_CLOUD_PERCENTAGE}% para esta zona.`,
    };
  }

  const closest = [...scenes].sort(
    (a, b) =>
      daysBetween(new Date(a.acquisitionDate), refDate) -
      daysBetween(new Date(b.acquisitionDate), refDate)
  )[0];

  const reflectance = await planetaryAdapter.getReflectanceAtPoint({
    latitude: zone.centroid.latitude,
    longitude: zone.centroid.longitude,
    startDate,
    endDate,
    sceneId: closest.sceneId,
    cloudCoverMax: VEGETATION_MAX_CLOUD_PERCENTAGE,
    sceneCloudPercentage: closest.cloudPercentage,
    sceneSystemTimeStart: closest.systemTimeStart,
  });

  if (!reflectance || reflectance.reflectanceSemanticStatus !== "valid") {
    return {
      zoneId,
      index: zone.index,
      found: false,
      message: "Se encontró una escena, pero no se pudo leer una reflectancia válida en este punto — sin datos suficientes para evaluar.",
    };
  }

  const value = computeSpectralIndex(zone.index, reflectance.reflectances);

  return {
    zoneId,
    index: zone.index,
    found: true,
    sceneId: closest.sceneId,
    acquisitionDate: closest.acquisitionDate,
    cloudPercentage: closest.cloudPercentage,
    daysFromReference: Number(daysBetween(new Date(closest.acquisitionDate), refDate).toFixed(1)),
    value,
    message: `Escena Sentinel-2 real del ${closest.acquisitionDate} (nubosidad ${closest.cloudPercentage ?? "?"}%).`,
  };
}
