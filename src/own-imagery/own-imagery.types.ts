/**
 * Imágenes propias (dron o campo) — APOYO Y VERIFICACIÓN, NO SATÉLITE.
 *
 * Estos registros:
 *  - siempre llevan `source: "imagen_propia"`;
 *  - nunca se convierten en pares de calibración satelitales;
 *  - nunca entran en R², RMSE ni MAE de Sentinel-2;
 *  - en tablas y exportaciones aparecen en columnas propias, separadas de los datos satelitales.
 * Solo sirven para comparación visual y verificación del tramo.
 */

export const OWN_IMAGE_SOURCE = "imagen_propia" as const;

export type OwnImageKind = "geotiff" | "foto";

export interface OwnImageBandStats {
  name: string;
  mean: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  validPixels: number;
}

export interface OwnImageRecord {
  id: string;
  source: typeof OWN_IMAGE_SOURCE;
  kind: OwnImageKind;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string | null;
  capturedAt: string | null;
  /** Punto o tramo al que se asocia la imagen. */
  target: { label: string; latitude: number; longitude: number };
  georef: {
    method: "geotiff" | "exif_gps" | "manual";
    crs: string | null;
    resolutionM: number | null;
    /** Posición de la cámara (fotos) y su distancia al punto. */
    cameraCoordinate: { latitude: number; longitude: number } | null;
    distanceToTargetM: number | null;
  };
  crop: {
    method: "ventana_geografica" | "centro_imagen";
    windowM: number | null;
    widthPx: number;
    heightPx: number;
  };
  /** Señal promedio por banda disponible en la ventana (valores del sensor: DN, no reflectancia). */
  bands: OwnImageBandStats[];
  notes: string[];
}

export const OWN_IMAGE_DISCLAIMER =
  "Imagen propia (dron o campo): apoyo y verificación visual. No es Sentinel-2, no forma pares de calibración y no entra en R², RMSE ni MAE.";
