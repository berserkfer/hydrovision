/**
 * PrismaMonitoringRepository — monitoreo PostgreSQL
 */

import type { HydroVisionDataStore } from "@/models";
import type { IMonitoringRepository } from "@/database/interfaces";
import { PrismaService } from "@/database/prisma.service";
import {
  aggregateMedicionesToParametros,
  mapCampana,
  mapEstacion,
  mapEvaluacionAmbiental,
  mapMuestreo,
} from "@/database/mappers/hydrovision-store.mapper";

export class PrismaMonitoringRepository implements IMonitoringRepository {
  async findAllEstaciones(): Promise<HydroVisionDataStore["estaciones"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.station.findMany({
      orderBy: { codigo: "asc" },
    });
    return rows.map(mapEstacion);
  }

  async findAllCampanas(): Promise<HydroVisionDataStore["campanas"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.campaign.findMany({
      orderBy: { codigo: "asc" },
    });
    return rows.map(mapCampana);
  }

  async findAllMuestras(): Promise<HydroVisionDataStore["muestras"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.muestreo.findMany({
      orderBy: { fechaMuestreo: "desc" },
    });
    return rows.map(mapMuestreo);
  }

  async findAllParametros(): Promise<HydroVisionDataStore["parametros"]> {
    const prisma = await PrismaService.getClient();
    const [muestreos, mediciones] = await Promise.all([
      prisma.muestreo.findMany(),
      prisma.measurement.findMany({ include: { parametro: true } }),
    ]);
    return aggregateMedicionesToParametros(muestreos, mediciones);
  }

  async findAllClasificaciones(): Promise<HydroVisionDataStore["clasificaciones"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.environmentalAssessment.findMany({
      orderBy: { evaluadoEn: "desc" },
    });
    return rows.map(mapEvaluacionAmbiental);
  }
}

export const prismaMonitoringRepository = new PrismaMonitoringRepository();
