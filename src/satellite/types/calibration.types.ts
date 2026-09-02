/**
 * Contratos para calibración futura campo ↔ Sentinel-2.
 * NO entrena modelos ni define coeficientes.
 */

import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type { Sentinel2BandCode } from "../catalog/sentinel2-bands.catalog";
import type { EstimatedVariableCode } from "../catalog/estimated-variables.catalog";

/** Variable medida en campo (referencia del catálogo de monitoreo) */
export type FieldCalibrationVariableCode =
  | "turbidity"
  | "ph"
  | "conductivity"
  | "dissolved_oxygen"
  | "chlorophyll_a";

/** Par conceptual campo ↔ observación satelital para calibración futura */
export interface FieldSatelliteCalibrationPair {
  fieldMeasurementId: string;
  satelliteObservationId: string;
  fieldVariable: FieldCalibrationVariableCode;
  satelliteProxy: SpectralIndexCode | Sentinel2BandCode;
  acquisitionDate: string;
  sampleDate: string;
}

/** Contrato de modelo de calibración — sin coeficientes ni entrenamiento */
export interface CalibrationModelContract {
  id: string;
  name: string;
  fieldVariable: FieldCalibrationVariableCode;
  estimatedVariable: EstimatedVariableCode;
  satelliteInputs: Array<SpectralIndexCode | Sentinel2BandCode>;
  status: "not_implemented" | "draft" | "validated";
  description: string;
}

export const CALIBRATION_MODEL_STUBS: CalibrationModelContract[] = [
  {
    id: "cal-turbidity-ndti",
    name: "Turbidez campo ↔ NDTI (futuro)",
    fieldVariable: "turbidity",
    estimatedVariable: "turbidity_estimated",
    satelliteInputs: ["NDTI", "B04", "B03"],
    status: "not_implemented",
    description:
      "Regresión futura entre turbidez medida (NTU) y proxy espectral NDTI. Sin coeficientes en esta fase.",
  },
  {
    id: "cal-chlorophyll-ndci",
    name: "Clorofila-a campo ↔ NDCI (futuro)",
    fieldVariable: "chlorophyll_a",
    estimatedVariable: "chlorophyll_a_estimated",
    satelliteInputs: ["NDCI", "B05", "B04"],
    status: "not_implemented",
    description:
      "Modelo futuro de estimación de clorofila-a a partir de NDCI calibrado con muestreos de laboratorio.",
  },
];
