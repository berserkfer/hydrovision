/**
 * Dataset del modelo ambiental — construido directamente desde las 20 muestras históricas
 * reales de Nizama & Cabrera (2018), ya cargadas en el store (ver dren-4000-real-data.ts).
 * Deliberadamente acotado a esas dos campañas por su id — así nunca arrastra en silencio
 * datos de otras campañas (nuevas o de otros ríos) que puedan cargarse después vía
 * Importación de Datos; ese es un dataset distinto con su propio N y sus propias reglas.
 */

import { getDataStore } from "@/data/store-access";
import {
  resolveWaterMatrix,
  type EnvironmentalMeasurementField,
  type EnvironmentalWaterMatrix,
} from "./config/environmental-parameters.config";

/** Ids de campaña del dataset histórico citado — ver dren-4000-real-data.ts */
export const ENVIRONMENTAL_MODEL_HISTORIC_CAMPAIGN_IDS: readonly string[] = [
  "camp-dren4000-2014-03",
  "camp-dren4000-2014-09",
];

export interface EnvironmentalSampleRow {
  stationCode: string;
  date: string;
  matrix: EnvironmentalWaterMatrix;
  values: Partial<Record<EnvironmentalMeasurementField, number>>;
}

export function buildEnvironmentalDataset(): EnvironmentalSampleRow[] {
  const store = getDataStore();
  const rows: EnvironmentalSampleRow[] = [];

  for (const muestra of store.muestras) {
    if (!ENVIRONMENTAL_MODEL_HISTORIC_CAMPAIGN_IDS.includes(muestra.campanaId)) continue;

    const estacion = store.estaciones.find((e) => e.id === muestra.estacionId);
    if (!estacion) continue;

    const matrix = resolveWaterMatrix(estacion.codigo);
    if (!matrix) continue;

    const parametros = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!parametros) continue;

    const { id: _id, muestraId: _muestraId, estacionId: _estacionId, createdAt: _c, updatedAt: _u, isSimulated: _s, ...values } =
      parametros as unknown as Record<string, unknown>;

    rows.push({
      stationCode: estacion.codigo,
      date: muestra.fechaMuestreo.slice(0, 10),
      matrix,
      values: values as Partial<Record<EnvironmentalMeasurementField, number>>,
    });
  }

  return rows;
}

export function getEnvironmentalRowsForMatrix(matrix: EnvironmentalWaterMatrix): EnvironmentalSampleRow[] {
  return buildEnvironmentalDataset().filter((r) => r.matrix === matrix);
}
