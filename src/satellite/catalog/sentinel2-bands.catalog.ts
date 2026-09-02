/**
 * Catálogo tipado de bandas Sentinel-2 MSI (L2A).
 * Referencia: ESA Sentinel-2 User Handbook — bandas espectrales MSI.
 * NO descarga imágenes; solo contratos para procesamiento futuro.
 */

export type Sentinel2BandCode =
  | "B02"
  | "B03"
  | "B04"
  | "B05"
  | "B06"
  | "B07"
  | "B08"
  | "B8A"
  | "B11"
  | "B12";

export interface Sentinel2BandDefinition {
  code: Sentinel2BandCode;
  /** Nombre técnico ESA */
  technicalName: string;
  /** Centro de banda aproximado (nm) */
  centralWavelengthNm: number;
  /** Ancho de banda aproximado (nm) */
  bandwidthNm: number;
  /** Resolución espacial nativa (m) */
  spatialResolutionMeters: 10 | 20 | 60;
  /** Uso potencial en monitoreo de calidad del agua */
  waterQualityUse: string;
}

export const SENTINEL2_PLATFORM = "Sentinel-2 MSI" as const;
export const SENTINEL2_DEFAULT_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED" as const;
export const SENTINEL2_PROCESSING_LEVEL = "L2A" as const;

export const SENTINEL2_BANDS: Record<Sentinel2BandCode, Sentinel2BandDefinition> = {
  B02: {
    code: "B02",
    technicalName: "Blue",
    centralWavelengthNm: 490,
    bandwidthNm: 65,
    spatialResolutionMeters: 10,
    waterQualityUse: "Corrección atmosférica, detección de materiales en aguas claras",
  },
  B03: {
    code: "B03",
    technicalName: "Green",
    centralWavelengthNm: 560,
    bandwidthNm: 35,
    spatialResolutionMeters: 10,
    waterQualityUse: "NDWI, MNDWI, NDTI; sensibilidad a clorofila y sedimentos",
  },
  B04: {
    code: "B04",
    technicalName: "Red",
    centralWavelengthNm: 665,
    bandwidthNm: 30,
    spatialResolutionMeters: 10,
    waterQualityUse: "NDVI, NDCI, NDTI; absorción de clorofila-a",
  },
  B05: {
    code: "B05",
    technicalName: "Red Edge 1",
    centralWavelengthNm: 705,
    bandwidthNm: 15,
    spatialResolutionMeters: 20,
    waterQualityUse: "NDCI; estimación de clorofila-a y fitoplancton",
  },
  B06: {
    code: "B06",
    technicalName: "Red Edge 2",
    centralWavelengthNm: 740,
    bandwidthNm: 15,
    spatialResolutionMeters: 20,
    waterQualityUse: "Vegetación riparia, estrés hídrico de cobertura emergente",
  },
  B07: {
    code: "B07",
    technicalName: "Red Edge 3",
    centralWavelengthNm: 783,
    bandwidthNm: 20,
    spatialResolutionMeters: 20,
    waterQualityUse: "Transición NIR; cobertura vegetal en márgenes",
  },
  B08: {
    code: "B08",
    technicalName: "NIR",
    centralWavelengthNm: 842,
    bandwidthNm: 115,
    spatialResolutionMeters: 10,
    waterQualityUse: "NDVI, NDWI; contraste agua/suelo/vegetación",
  },
  B8A: {
    code: "B8A",
    technicalName: "NIR narrow",
    centralWavelengthNm: 865,
    bandwidthNm: 20,
    spatialResolutionMeters: 20,
    waterQualityUse: "Alternativa NIR para índices de vegetación y humedad",
  },
  B11: {
    code: "B11",
    technicalName: "SWIR 1",
    centralWavelengthNm: 1610,
    bandwidthNm: 90,
    spatialResolutionMeters: 20,
    waterQualityUse: "MNDWI; turbidez y sólidos suspendidos (proxy)",
  },
  B12: {
    code: "B12",
    technicalName: "SWIR 2",
    centralWavelengthNm: 2190,
    bandwidthNm: 180,
    spatialResolutionMeters: 20,
    waterQualityUse: "Discriminación suelo/humedad; turbidez en aguas turbias",
  },
};

export const SENTINEL2_BAND_CODES = Object.keys(SENTINEL2_BANDS) as Sentinel2BandCode[];

/** Reflectancia de superficie por banda (0–1 o escala L2A) */
export type Sentinel2ReflectanceMap = Partial<Record<Sentinel2BandCode, number>>;

export function getSentinel2Band(code: Sentinel2BandCode): Sentinel2BandDefinition {
  return SENTINEL2_BANDS[code];
}

export function maxSpatialResolution(bands: Sentinel2BandCode[]): number {
  return Math.max(...bands.map((b) => SENTINEL2_BANDS[b].spatialResolutionMeters));
}

export function isSentinel2BandCode(value: string): value is Sentinel2BandCode {
  return value in SENTINEL2_BANDS;
}
