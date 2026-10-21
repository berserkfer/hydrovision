/**
 * Referencia satelital para el módulo de foto (Nivel 2) — usa el selector de proveedor
 * Sentinel-2 (Copernicus por defecto, Planetary Computer como respaldo) y el mismo catálogo
 * de índices espectrales que el resto de la plataforma. NUNCA combina el índice satelital
 * con la estimación de la foto en una sola cifra — solo se muestran lado a lado.
 */

import { SATELLITE_PROVIDER_LABELS, sentinel2Provider } from "@/server/satellite/sentinel2-provider";
import { computeSpectralIndex } from "@/satellite/catalog/spectral-indices.catalog";

const MAX_DAYS_DIFFERENCE = 5;
const MAX_CLOUD_PERCENTAGE = 30;

export interface PhotoSatelliteReference {
  found: boolean;
  sceneId?: string;
  /** Proveedor que sirvió la escena (Copernicus o Planetary Computer). */
  provider?: string;
  acquisitionDate?: string;
  cloudPercentage?: number | null;
  daysFromCapture?: number;
  ndti?: number | null;
  message: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

export async function findPhotoSatelliteReference(
  latitude: number,
  longitude: number,
  referenceDateIso: string
): Promise<PhotoSatelliteReference> {
  const refDate = new Date(referenceDateIso);
  if (Number.isNaN(refDate.getTime())) {
    return { found: false, message: "Fecha de la foto inválida." };
  }

  const startDate = new Date(refDate.getTime() - MAX_DAYS_DIFFERENCE * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const endDate = new Date(refDate.getTime() + MAX_DAYS_DIFFERENCE * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const found = await sentinel2Provider.searchScenes({
    latitude,
    longitude,
    startDate,
    endDate,
    cloudCoverMax: MAX_CLOUD_PERCENTAGE,
    limit: 5,
  });

  if (!found) {
    return {
      found: false,
      message: `Sin escenas Sentinel-2 dentro de ±${MAX_DAYS_DIFFERENCE} días y nubosidad ≤${MAX_CLOUD_PERCENTAGE}% para esta ubicación — el resultado se queda en el Nivel 1.`,
    };
  }

  const { provider, scenes } = found;
  const closest = [...scenes].sort(
    (a, b) =>
      daysBetween(new Date(a.acquisitionDate), refDate) -
      daysBetween(new Date(b.acquisitionDate), refDate)
  )[0];

  const reflectance = await sentinel2Provider.getReflectance(provider, {
    latitude,
    longitude,
    startDate,
    endDate,
    sceneId: closest.sceneId,
    cloudCoverMax: MAX_CLOUD_PERCENTAGE,
    sceneCloudPercentage: closest.cloudPercentage,
    sceneSystemTimeStart: closest.systemTimeStart,
  });

  if (!reflectance || reflectance.reflectanceSemanticStatus !== "valid") {
    return {
      found: false,
      message: "Se encontró una escena, pero no se pudo leer una reflectancia válida en este punto — el resultado se queda en el Nivel 1.",
    };
  }

  const ndti = computeSpectralIndex("NDTI", reflectance.reflectances);

  return {
    found: true,
    sceneId: closest.sceneId,
    provider: SATELLITE_PROVIDER_LABELS[provider],
    acquisitionDate: closest.acquisitionDate,
    cloudPercentage: closest.cloudPercentage,
    daysFromCapture: Number(daysBetween(new Date(closest.acquisitionDate), refDate).toFixed(1)),
    ndti,
    message: `Escena Sentinel-2 real del ${closest.acquisitionDate} (nubosidad ${closest.cloudPercentage ?? "?"}%, ${SATELLITE_PROVIDER_LABELS[provider]}) — referencia, no combinada con la estimación de la foto.`,
  };
}
