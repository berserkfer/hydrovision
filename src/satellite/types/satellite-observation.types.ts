/**
 * Contrato conceptual de observación satelital — agrega índices, reflectancias y metadatos.
 * Mapea parcialmente a Prisma SatelliteIndex + ImagenSatelital (bandas/metadata JSON).
 */

import type { Sentinel2BandCode, Sentinel2ReflectanceMap } from "../catalog/sentinel2-bands.catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { EstimatedVariableCode } from "../catalog/estimated-variables.catalog";
import type { SatelliteQualityMetadata } from "./satellite-metadata.types";
import type { SourceType } from "./data-origin.types";

export type SatellitePlatform = "sentinel2" | "landsat8" | "landsat9";

/** Valores de índices espectrales calculados (adimensionales) */
export type SpectralIndexValues = Partial<Record<SpectralIndexCode, number>>;

/** Variable estimada — siempre derivada/proxy/modelo, nunca medición directa */
export interface EstimatedVariableValue {
  code: EstimatedVariableCode;
  value: number | null;
  unit: string;
  derivationKind: "proxy" | "model" | "derived";
  isSimulated: boolean;
  /** No disponible hasta calibración */
  status: "not_available" | "placeholder";
}

/**
 * Observación satelital unificada para API y servicios.
 * NO confundir con Measurement (campo).
 */
export interface SatelliteObservation {
  id: string;
  stationId: string;
  acquisitionDate: string;
  sensor: string;
  platform: SatellitePlatform;
  collection: string;
  sceneId: string | null;
  cloudPercentage: number | null;
  /** Footprint opcional — GeoJSON string si está disponible en metadata Prisma */
  footprintGeoJson?: string | null;
  bandsUsed: Sentinel2BandCode[];
  reflectances?: Sentinel2ReflectanceMap;
  indices: SpectralIndexValues;
  estimatedVariables: EstimatedVariableValue[];
  source: SatellitePlatform;
  sourceType: SourceType;
  isSimulated: boolean;
  spatialResolutionMeters: number;
  quality: SatelliteQualityMetadata;
  createdAt: string;
}

/** Escena satelital (selección previa al cálculo de índices) — contrato futuro */
export interface SatelliteScene {
  sceneId: string;
  stationId: string;
  acquisitionDate: string;
  platform: SatellitePlatform;
  collection: string;
  cloudPercentage: number | null;
  tileId: string | null;
  isSimulated: boolean;
  sourceType: "satellite";
  bandsAvailable: Sentinel2BandCode[];
  previewUrl?: string | null;
}
