/**
 * Contrato conceptual de observación satelital — agrega índices, reflectancias y metadatos.
 * Mapea parcialmente a Prisma SatelliteIndex + ImagenSatelital (bandas/metadata JSON).
 */

import type { WaterPixelSelectionRecord } from "../quality/water-pixel-selection";
import type { Sentinel2BandCode, Sentinel2ReflectanceMap } from "../catalog/sentinel2-bands.catalog";
import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { EstimatedVariableCode } from "../catalog/estimated-variables.catalog";
import type { SatelliteQualityMetadata } from "./satellite-metadata.types";
import type { SatelliteDataProvider, SourceType } from "./data-origin.types";
import type { WaterSufficiency } from "../quality/water-fraction";

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
  /** Proveedor que sirvió la observación (Planetary, Copernicus, GEE…). */
  provider?: SatelliteDataProvider;
  isSimulated: boolean;
  spatialResolutionMeters: number;
  /** Fracción de píxeles de agua en la ventana analizada (0–1). null = desconocida. */
  waterFraction?: number | null;
  /** Píxeles válidos usados para calcular waterFraction. */
  pixelsUsed?: number;
  /** Suficiencia de píxeles acuáticos para emitir un valor. */
  waterSufficiency?: WaterSufficiency;
  /** Selección del píxel de agua: coordenada original/ajustada, distancia y motivo. */
  waterPixelSelection?: WaterPixelSelectionRecord;
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
