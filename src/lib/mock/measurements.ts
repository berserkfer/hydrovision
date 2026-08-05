/**
 * Mock de mediciones históricas por estación — Sprint 2C
 */

import { classifyMeasurement } from "@/lib/eca/classifier";
import { getDataStore } from "@/data/store-access";
import type { FieldMeasurement } from "@/types";
import type { StationMeasurementRecord, StationSatelliteIndexRecord } from "@/types/station-management";

const MONTHS = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
];

function seededVariance(stationId: string, monthIndex: number, base: number, spread: number): number {
  const hash = stationId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const wave = Math.sin((hash + monthIndex) * 0.7) * spread;
  return Number((base + wave).toFixed(2));
}

/** Serie histórica simulada de 12 meses por estación */
export function getMockMeasurementsByStation(stationId: string): StationMeasurementRecord[] {
  const store = getDataStore();
  const estacion = store.estaciones.find((e) => e.id === stationId);
  const paramActual = store.parametros.find((p) => p.estacionId === stationId);

  const basePh = paramActual?.ph ?? 7.2;
  const baseTurb = paramActual?.turbidez ?? 20;
  const baseCond = paramActual?.conductividad ?? 500;
  const baseOd = paramActual?.oxigenoDisuelto ?? 6;
  const baseTemp = paramActual?.temperatura ?? 25;

  return MONTHS.map((month, i) => {
    const ph = seededVariance(stationId, i, basePh, 0.4);
    const turbidity = seededVariance(stationId, i + 1, baseTurb, 6);
    const conductivity = seededVariance(stationId, i + 2, baseCond, 80);
    const dissolvedOxygen = seededVariance(stationId, i + 3, baseOd, 0.8);
    const temperature = seededVariance(stationId, i + 4, baseTemp, 1.5);

    const measurement: FieldMeasurement = {
      id: `hist-${stationId}-${month}`,
      stationId: estacion?.codigo ?? stationId,
      sampledAt: `${month}-15T10:00:00-05:00`,
      ph,
      turbidity,
      conductivity,
      dissolvedOxygen,
      temperature,
      bod5: paramActual?.dbo5 ?? 10,
      cod: paramActual?.dqo ?? 30,
      coliforms: paramActual?.coliformes ?? 200,
      isSimulated: true,
    };

    const compliance = classifyMeasurement(measurement);

    return {
      id: measurement.id,
      fecha: `${month}-15`,
      ph,
      turbidez: turbidity,
      conductividad: conductivity,
      oxigenoDisuelto: dissolvedOxygen,
      temperatura: temperature,
      clasificacionEca: compliance.status,
    };
  });
}

/** Índices satelitales simulados para detalle de estación */
export function getMockSatelliteIndicesByStation(stationId: string): StationSatelliteIndexRecord {
  const store = getDataStore();
  const indice = store.indicesSatelitales.find((i) => i.estacionId === stationId);

  if (!indice) {
    return {
      fechaAdquisicion: "2025-06-10",
      fuente: "sentinel2",
      ndwi: 0.12,
      ndvi: 0.35,
      mndwi: 0.08,
      ndti: -0.02,
      coberturaNubosa: 8,
    };
  }

  return {
    fechaAdquisicion: indice.fechaAdquisicion,
    fuente: indice.fuente,
    ndwi: indice.ndwi,
    ndvi: indice.ndvi,
    mndwi: indice.mndwi,
    ndti: indice.ndti,
    coberturaNubosa: indice.coberturaNubosa,
  };
}

export function getMockEcaDetailByStation(stationId: string) {
  const store = getDataStore();
  const clasificacion = store.clasificaciones.find((c) => c.estacionId === stationId);
  return {
    parametrosViolados: clasificacion?.parametrosViolados ?? [],
    parametrosEnAlerta: clasificacion?.parametrosEnAlerta ?? [],
  };
}
