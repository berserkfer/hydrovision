/**
 * Metadatos de calidad para observaciones satelitales.
 */

import type { Sentinel2BandCode } from "../catalog/sentinel2-bands.catalog";
import type { PixelQualityStatus } from "../quality/pixel-quality";
import type { ReflectanceSemanticStatus, ReflectanceScaleEvidence } from "@/server/gee/gee-band.mapper";
import type { SpatialRepresentativeness } from "@/server/gee/gee.adapter.types";

export interface SatelliteQualityMetadata {
  acquisitionDate: string;
  processingLevel: string;
  cloudPercentage: number | null;
  sceneId: string | null;
  sensor: string;
  platform: string;
  collection: string;
  source: string;
  isSimulated: boolean;
  spatialResolutionMeters: number;
  bandsUsed: Sentinel2BandCode[];
  /** Point sampling — no garantiza representatividad del cuerpo de agua */
  spatialRepresentativeness: SpatialRepresentativeness;
  reflectanceSemanticStatus?: ReflectanceSemanticStatus;
  scaleEvidence?: ReflectanceScaleEvidence;
  pixelQualityStatus?: PixelQualityStatus;
  sclRawValue?: number | null;
  systemTimeStart?: number | null;
  tileId?: string | null;
  qualityNotes?: string;
}

export const DEFAULT_CLOUD_MASK_REQUIREMENT =
  "Point sampling con SCL cuando está disponible. Metadata de escena (CLOUDY_PIXEL_PERCENTAGE) ≠ calidad de píxel (SCL). No se asume 0% nubes cuando cloudPercentage es null." as const;

export const POINT_SAMPLING_LIMITATION =
  "La extracción es point sampling en coordenadas de estación. No garantiza representatividad espacial del cuerpo de agua." as const;
