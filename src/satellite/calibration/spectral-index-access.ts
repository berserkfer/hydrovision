/**
 * Acceso a valores de índice espectral desde pares científicos.
 */

import type { SpectralIndexCode } from "../catalog/spectral-indices.catalog";
import type {
  ScientificFieldSatellitePair,
  SpectralIndicesSnapshot,
} from "../types/scientific-dataset.types";

const INDEX_TO_SNAPSHOT: Record<SpectralIndexCode, keyof SpectralIndicesSnapshot> = {
  NDVI: "ndvi",
  NDCI: "ndci",
  NDWI: "ndwi",
  MNDWI: "mndwi",
  NDTI: "ndti",
  NDMI: "ndmi",
};

export function getPredictorValueFromPair(
  pair: ScientificFieldSatellitePair,
  index: SpectralIndexCode
): number | null {
  const key = INDEX_TO_SNAPSHOT[index];
  const value = pair.spectralIndices[key];
  return value === null || !Number.isFinite(value) ? null : value;
}

export function snapshotKeyForIndex(index: SpectralIndexCode): keyof SpectralIndicesSnapshot {
  return INDEX_TO_SNAPSHOT[index];
}

export function isRealCalibrationPair(pair: ScientificFieldSatellitePair): boolean {
  return (
    !pair.isSimulated &&
    pair.sourceTypeField === "field" &&
    pair.sourceTypeSatellite === "satellite" &&
    pair.qualityStatus === "accepted"
  );
}

export function filterRealCalibrationPairs(
  pairs: ScientificFieldSatellitePair[]
): ScientificFieldSatellitePair[] {
  return pairs.filter(isRealCalibrationPair);
}
