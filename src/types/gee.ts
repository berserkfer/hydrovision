export type SpectralIndex = "NDWI" | "NDVI" | "MNDWI" | "NDTI";

export interface SatelliteImageMetadata {
  stationId: string;
  acquiredAt: string;
  source: "landsat8" | "landsat9" | "sentinel2";
  cloudCover: number;
  resolution: number;
}

export interface CalculatedIndices {
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
}

export interface MapLayerDefinition {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  type: "raster" | "vector" | "marker";
}

export interface RegionOfInterest {
  name: string;
  bounds: [number, number, number, number];
}
