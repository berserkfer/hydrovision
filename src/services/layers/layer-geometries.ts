/**
 * Geometrías simuladas para capas vectoriales y bounds raster.
 */

import type { MapCenter } from "@/types/geography";
import type { RasterBounds, VectorGeometry } from "@/types/layers";
import { LAYER_IDS } from "@/types/layers";
import type { GeoRiver } from "@/types/geography";

function rectPolygon(center: MapCenter, scale: number): [number, number][] {
  const { latitude: lat, longitude: lng } = center;
  const dLat = 0.04 * scale;
  const dLng = 0.05 * scale;
  return [
    [lat - dLat, lng - dLng],
    [lat - dLat, lng + dLng],
    [lat + dLat, lng + dLng],
    [lat + dLat, lng - dLng],
  ];
}

export function buildVectorGeometries(
  river: GeoRiver,
  center: MapCenter
): VectorGeometry[] {
  const stationCoords: [number, number][] = river.stations.map((s) => [
    s.latitude,
    s.longitude,
  ]);

  const riverLine: [number, number][] =
    stationCoords.length >= 2
      ? stationCoords
      : [
          [center.latitude - 0.02, center.longitude - 0.03],
          [center.latitude, center.longitude],
          [center.latitude + 0.02, center.longitude + 0.03],
        ];

  return [
    {
      layerId: LAYER_IDS.RIVERS,
      coordinates: riverLine,
    },
    {
      layerId: LAYER_IDS.WATERSHEDS,
      coordinates: rectPolygon(center, 1.2),
    },
    {
      layerId: LAYER_IDS.DISTRICTS,
      coordinates: rectPolygon(center, 1.6),
    },
    {
      layerId: LAYER_IDS.PROVINCES,
      coordinates: rectPolygon(center, 2.2),
    },
    {
      layerId: LAYER_IDS.DEPARTMENTS,
      coordinates: rectPolygon(center, 3),
    },
  ];
}

export function buildRasterBounds(center: MapCenter): RasterBounds[] {
  const sw: [number, number] = [center.latitude - 0.06, center.longitude - 0.07];
  const ne: [number, number] = [center.latitude + 0.06, center.longitude + 0.07];

  return [
    { layerId: LAYER_IDS.NDWI, southWest: sw, northEast: ne },
    { layerId: LAYER_IDS.NDVI, southWest: sw, northEast: ne },
    { layerId: LAYER_IDS.MNDWI, southWest: sw, northEast: ne },
    { layerId: LAYER_IDS.ENVIRONMENTAL_RISK, southWest: sw, northEast: ne },
  ];
}

/** Genera data URL de raster simulado con gradiente */
export function generateSimulatedRasterDataUrl(
  colorStart: string,
  colorEnd: string,
  width = 256,
  height = 256
): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(0.5, colorEnd);
  gradient.addColorStop(1, colorStart);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 30,
      Math.random() * 30
    );
  }

  return canvas.toDataURL();
}
