import type { RgbMeans, RrsRgb } from "./hydrocolor-formula";
import type { PhotoConfidenceLevel, PhotoFormulaSource } from "./confidence-tiers";
import type { PhotoCalibrationParameterCode } from "./photo-calibration.store";

export interface PhotoSatelliteReferenceSummary {
  found: boolean;
  sceneId?: string;
  acquisitionDate?: string;
  ndti?: number | null;
}

export interface PhotoLabSample {
  parameterCode: PhotoCalibrationParameterCode;
  value: number;
  labDate: string;
}

/** Lo que el cliente (offline-capable) produce y eventualmente sincroniza al servidor. */
export interface PhotoObservationInput {
  /** UUID generado en el cliente — clave de idempotencia para la sincronización. */
  id: string;
  capturedAt: string;
  gps: { latitude: number; longitude: number } | null;
  connectivityAtCapture: "online" | "offline";
  hasReferencePanel: boolean;
  waterRgb: RgbMeans;
  skyRgb: RgbMeans;
  cardRgb: RgbMeans | null;
  rrs: RrsRgb | null;
  qualitativeColorIndex: number | null;
  turbidityNtu: number | null;
  turbiditySaturated: boolean;
  confidenceLevel: PhotoConfidenceLevel;
  formulaSource: PhotoFormulaSource;
  confidenceLabel: string;
  satelliteReference?: PhotoSatelliteReferenceSummary | null;
  labSample?: PhotoLabSample | null;
}

export interface PhotoObservationRecord extends PhotoObservationInput {
  receivedAt: string;
}
