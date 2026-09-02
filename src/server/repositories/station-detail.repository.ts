/**
 * Enriquecimiento de detalle de estación — mock o Prisma según DATA_SOURCE
 */

import { getMonitoringDataSource } from "@/config/monitoring-data-source.config";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import { getMockCampaignsByStation } from "@/lib/mock/campaigns";
import {
  getMockEcaDetailByStation,
  getMockMeasurementsByStation,
  getMockSatelliteIndicesByStation,
} from "@/lib/mock/measurements";
import { classifyParametros } from "@/lib/sampling/sampling-utils";
import { prisma } from "@/server/db";
import type {
  StationCampaignHistoryDto,
  StationMeasurementDto,
  StationSatelliteIndexDto,
} from "@/server/dto/station.dto";
import { mapPrismaEstadoCampana } from "./prisma/monitoring.mappers";

const EMPTY_SATELLITE_INDICES: StationSatelliteIndexDto = {
  fechaAdquisicion: "—",
  fuente: "sentinel2",
  ndwi: 0,
  ndvi: 0,
  mndwi: 0,
  ndti: 0,
  coberturaNubosa: 0,
};

export interface StationDetailEnrichment {
  campanas: StationCampaignHistoryDto[];
  mediciones: StationMeasurementDto[];
  indicesSatelitales: StationSatelliteIndexDto;
  parametrosViolados: string[];
  parametrosEnAlerta: string[];
}

function mapMockCampaigns(stationId: string): StationCampaignHistoryDto[] {
  return getMockCampaignsByStation(stationId);
}

function mapMockMeasurements(stationId: string): StationMeasurementDto[] {
  return getMockMeasurementsByStation(stationId);
}

async function loadFromDatabase(stationId: string): Promise<StationDetailEnrichment> {
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return {
      campanas: [],
      mediciones: [],
      indicesSatelitales: EMPTY_SATELLITE_INDICES,
      parametrosViolados: [],
      parametrosEnAlerta: [],
    };
  }

  const [campaigns, muestreos, latestEval, satelliteIndex] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        NOT: { estado: "cancelled" },
        OR: [
          { muestreos: { some: { puntoMonitoreoId: stationId } } },
          { rioId: station.rioId ?? undefined },
          { cuencaId: station.cuencaId },
        ],
      },
      include: {
        muestreos: {
          where: { puntoMonitoreoId: stationId },
          select: { id: true },
        },
      },
      orderBy: { fechaInicio: "desc" },
    }),
    prisma.muestreo.findMany({
      where: { puntoMonitoreoId: stationId },
      orderBy: { fechaMuestreo: "desc" },
    }),
    prisma.environmentalAssessment.findFirst({
      where: { puntoMonitoreoId: stationId },
      orderBy: { evaluadoEn: "desc" },
    }),
    prisma.satelliteIndex.findFirst({
      where: { puntoMonitoreoId: stationId },
      orderBy: { fechaAdquisicion: "desc" },
    }),
  ]);

  const campanas: StationCampaignHistoryDto[] = campaigns.map((campana) => ({
    id: campana.id,
    codigo: campana.codigo,
    nombre: campana.nombre,
    fechaInicio: campana.fechaInicio.toISOString().slice(0, 10),
    fechaFin: campana.fechaFin.toISOString().slice(0, 10),
    estado: mapPrismaEstadoCampana(campana.estado),
    muestrasEnEstacion: campana.muestreos.length,
  }));

  const medicionesRows: StationMeasurementDto[] = [];
  if (muestreos.length > 0) {
    const mediciones = await prisma.measurement.findMany({
      where: {
        muestreoId: { in: muestreos.map((m) => m.id) },
        estado: "active",
      },
      include: { parametro: true },
    });

    for (const muestreo of muestreos) {
      const rows = mediciones.filter((m) => m.muestreoId === muestreo.id);
      const [parametros] = aggregateMedicionesToParametros([muestreo], rows);
      if (!parametros) continue;

      const fecha = muestreo.fechaMuestreo.toISOString().slice(0, 10);
      const compliance = classifyParametros(parametros, station.codigo, fecha);

      medicionesRows.push({
        id: muestreo.id,
        fecha,
        ph: parametros.ph,
        turbidez: parametros.turbidez,
        conductividad: parametros.conductividad,
        oxigenoDisuelto: parametros.oxigenoDisuelto,
        temperatura: parametros.temperatura,
        clasificacionEca: compliance.status,
      });
    }
  }

  const indicesSatelitales: StationSatelliteIndexDto = satelliteIndex
    ? {
        fechaAdquisicion: satelliteIndex.fechaAdquisicion.toISOString().slice(0, 10),
        fuente: satelliteIndex.fuente,
        ndwi: satelliteIndex.ndwi,
        ndvi: satelliteIndex.ndvi,
        mndwi: satelliteIndex.mndwi,
        ndti: satelliteIndex.ndti,
        coberturaNubosa: satelliteIndex.coberturaNubosa,
      }
    : EMPTY_SATELLITE_INDICES;

  return {
    campanas,
    mediciones: medicionesRows,
    indicesSatelitales,
    parametrosViolados: (latestEval?.parametrosViolados as string[] | undefined) ?? [],
    parametrosEnAlerta: (latestEval?.parametrosEnAlerta as string[] | undefined) ?? [],
  };
}

export async function getStationDetailEnrichment(
  stationId: string
): Promise<StationDetailEnrichment> {
  if (getMonitoringDataSource() === "database") {
    return loadFromDatabase(stationId);
  }

  const eca = getMockEcaDetailByStation(stationId);
  return {
    campanas: mapMockCampaigns(stationId),
    mediciones: mapMockMeasurements(stationId),
    indicesSatelitales: getMockSatelliteIndicesByStation(stationId),
    parametrosViolados: eca.parametrosViolados.map(String),
    parametrosEnAlerta: eca.parametrosEnAlerta.map(String),
  };
}
