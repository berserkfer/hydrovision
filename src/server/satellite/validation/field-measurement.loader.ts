/**
 * Carga de mediciones de campo para matching — sin modificar pipeline ECA.
 */

import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { PARAMETRO_CATALOG, type ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import { getDataStore } from "@/data/store-access";
import { prisma } from "@/server/db";
import type { MatchableFieldSample } from "@/satellite/matching/field-satellite-matching";

export interface FieldParameterValue {
  sampleId: string;
  stationId: string;
  date: string;
  parameterCode: ParametroCodigoDb;
  value: number | null;
  unit: string;
  latitude?: number;
  longitude?: number;
  isSimulated: boolean;
}

export interface FieldSampleQuery {
  stationId: string;
  fechaInicio?: string;
  fechaFin?: string;
  parameterCode?: ParametroCodigoDb;
}

function inDateRange(date: string, start?: string, end?: string): boolean {
  const d = date.slice(0, 10);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

function extractParametersFromDomain(
  sampleId: string,
  stationId: string,
  date: string,
  params: Record<string, number | undefined>,
  isSimulated: boolean,
  coords?: { latitude: number; longitude: number }
): FieldParameterValue[] {
  const rows: FieldParameterValue[] = [];

  for (const entry of PARAMETRO_CATALOG) {
    const raw = params[entry.domainField];
    rows.push({
      sampleId,
      stationId,
      date,
      parameterCode: entry.codigo,
      value: raw === undefined || raw === null ? null : raw,
      unit: entry.unidad,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      isSimulated,
    });
  }

  return rows;
}

function loadFromMockStore(query: FieldSampleQuery): {
  samples: MatchableFieldSample[];
  parameters: FieldParameterValue[];
  isSimulated: true;
} {
  const store = getDataStore();
  const station = store.estaciones.find((e) => e.id === query.stationId);
  const coords = station
    ? { latitude: station.coordenadas.latitude, longitude: station.coordenadas.longitude }
    : undefined;

  const muestras = store.muestras.filter(
    (m) =>
      m.estacionId === query.stationId &&
      inDateRange(m.fechaMuestreo, query.fechaInicio, query.fechaFin)
  );

  const samples: MatchableFieldSample[] = muestras.map((m) => ({
    sampleId: m.id,
    stationId: m.estacionId,
    date: m.fechaMuestreo,
    ...coords,
  }));

  const parameters: FieldParameterValue[] = [];
  for (const muestra of muestras) {
    const parametros = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!parametros) continue;
    parameters.push(
      ...extractParametersFromDomain(
        muestra.id,
        muestra.estacionId,
        muestra.fechaMuestreo,
        parametros as unknown as Record<string, number | undefined>,
        true,
        coords
      )
    );
  }

  return { samples, parameters, isSimulated: true };
}

async function loadFromDatabase(query: FieldSampleQuery): Promise<{
  samples: MatchableFieldSample[];
  parameters: FieldParameterValue[];
  isSimulated: false;
}> {
  const station = await prisma.station.findUnique({
    where: { id: query.stationId },
    select: { id: true, latitude: true, longitude: true },
  });

  const coords = station
    ? { latitude: station.latitude, longitude: station.longitude }
    : undefined;

  const muestreos = await prisma.muestreo.findMany({
    where: { puntoMonitoreoId: query.stationId },
    orderBy: { fechaMuestreo: "desc" },
  });

  const filtered = muestreos.filter((m) =>
    inDateRange(m.fechaMuestreo.toISOString(), query.fechaInicio, query.fechaFin)
  );

  const samples: MatchableFieldSample[] = filtered.map((m) => ({
    sampleId: m.id,
    stationId: m.puntoMonitoreoId,
    date: m.fechaMuestreo.toISOString(),
    ...coords,
  }));

  const parameters: FieldParameterValue[] = [];

  if (filtered.length > 0) {
    const mediciones = await prisma.measurement.findMany({
      where: {
        muestreoId: { in: filtered.map((m) => m.id) },
        estado: "active",
      },
      include: { parametro: true },
    });

    for (const muestreo of filtered) {
      const rows = mediciones.filter((m) => m.muestreoId === muestreo.id);
      const [parametros] = aggregateMedicionesToParametros([muestreo], rows);
      if (!parametros) continue;

      parameters.push(
        ...extractParametersFromDomain(
          muestreo.id,
          muestreo.puntoMonitoreoId,
          muestreo.fechaMuestreo.toISOString(),
          {
            ph: parametros.ph,
            turbidez: parametros.turbidez,
            conductividad: parametros.conductividad,
            oxigenoDisuelto: parametros.oxigenoDisuelto,
            temperatura: parametros.temperatura,
            dbo5: parametros.dbo5,
            dqo: parametros.dqo,
            coliformes: parametros.coliformes,
            nitratos: parametros.nitratos,
            fosfatos: parametros.fosfatos,
            solidosDisueltosTotales: parametros.solidosDisueltosTotales,
            caudal: parametros.caudal,
          },
          false,
          coords
        )
      );
    }
  }

  return { samples, parameters, isSimulated: false };
}

export async function loadFieldMeasurementsForMatching(query: FieldSampleQuery) {
  if (isMonitoringDatabaseEnabled()) {
    return loadFromDatabase(query);
  }
  return loadFromMockStore(query);
}

export function filterParametersByCode(
  parameters: FieldParameterValue[],
  parameterCode?: ParametroCodigoDb
): FieldParameterValue[] {
  if (!parameterCode) return parameters;
  return parameters.filter((p) => p.parameterCode === parameterCode);
}
