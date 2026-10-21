/**
 * Tipos del adaptador GEE — datos crudos sin índices calculados.
 */

import type { WaterPixelSelectionRecord } from "@/satellite/quality/water-pixel-selection";
import type { Sentinel2BandCode, Sentinel2ReflectanceMap } from "@/satellite/catalog/sentinel2-bands.catalog";
import type { PixelQualityStatus } from "@/satellite/quality/pixel-quality";
import type { WaterSufficiency } from "@/satellite/quality/water-fraction";
import type { ReflectanceScaleEvidence, ReflectanceSemanticStatus } from "./gee-band.mapper";

export type SpatialRepresentativeness = "point_sampling";

export interface GeeSceneRecord {
  sceneId: string;
  /** Debe coincidir con sceneId (system:index) */
  systemIndex: string;
  acquisitionDate: string;
  /** null = desconocido — nunca asumir 0% */
  cloudPercentage: number | null;
  tileId: string | null;
  collection: string;
  platform: "sentinel2";
  systemTimeStart: number | null;
  /**
   * "copernicus_live"/"planetary_computer_live" incluidos para reuso estructural por
   * CopernicusAdapter/PlanetaryAdapter (mismo shape que GeeSceneRecord — ver
   * src/server/copernicus/copernicus.adapter.types.ts y src/server/planetary/planetary.adapter.types.ts).
   */
  metadataSource: "gee_live" | "copernicus_live" | "planetary_computer_live" | "simulated" | "partial" | "unavailable";
  /** true si acquisitionDate deriva de system:time_start */
  acquisitionFromSystemTime: boolean;
}

export interface GeeReflectanceRecord {
  sceneId: string | null;
  acquisitionDate: string;
  cloudPercentage: number | null;
  reflectances: Sentinel2ReflectanceMap;
  bandsUsed: Sentinel2BandCode[];
  /** Valores crudos espectrales (B2, B3, …) — sin SCL */
  rawBandValues: Record<string, number>;
  reflectanceSemanticStatus: ReflectanceSemanticStatus;
  scaleEvidence: ReflectanceScaleEvidence;
  pixelQualityStatus: PixelQualityStatus;
  sclRawValue: number | null;
  spatialRepresentativeness: SpatialRepresentativeness;
  systemTimeStart: number | null;
  /** Ventana de píxeles: fracción de agua, píxeles válidos y suficiencia. */
  waterFraction?: number | null;
  pixelsUsed?: number;
  waterSufficiency?: WaterSufficiency;
  /** Selección robusta del píxel de agua (solo proveedores que la implementan: Planetary). */
  waterPixelSelection?: WaterPixelSelectionRecord;
}

export interface GeeSceneSearchRequest {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  limit?: number;
}

export interface GeeReflectanceRequest extends GeeSceneSearchRequest {
  sceneId?: string;
  /** Cobertura nubosa conocida de la escena seleccionada */
  sceneCloudPercentage?: number | null;
  /** system:time_start ms de la escena seleccionada */
  sceneSystemTimeStart?: number | null;
}

export interface GeeAdapterStatus {
  isConfigured: boolean;
  isLive: boolean;
  authMode: "simulated" | "service_account";
  message: string;
}
