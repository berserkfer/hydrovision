/**
 * PrismaDataStoreLoader — carga HydroVisionDataStore desde PostgreSQL
 */

import type { HydroVisionDataStore } from "@/models";
import type { IDataStoreLoader } from "@/database/interfaces";
import { PrismaService } from "@/database/prisma.service";
import {
  aggregateMedicionesToParametros,
  mapCampana,
  mapCuenca,
  mapDepartamento,
  mapDistrito,
  mapEstacion,
  mapEvaluacionAmbiental,
  mapIndiceSatelital,
  mapMuestreo,
  mapProvincia,
  mapReporte,
  mapRio,
  mapUsuario,
} from "@/database/mappers/hydrovision-store.mapper";

export class PrismaDataStoreLoader implements IDataStoreLoader {
  async loadStore(): Promise<HydroVisionDataStore> {
    const prisma = await PrismaService.getClient();

    const [
      departamentos,
      provincias,
      distritos,
      cuencas,
      rios,
      estaciones,
      campanas,
      muestreos,
      mediciones,
      evaluaciones,
      indicesSatelitales,
      usuarios,
      reportes,
      reporteEstaciones,
    ] = await Promise.all([
      prisma.departamento.findMany({ orderBy: { nombre: "asc" } }),
      prisma.provincia.findMany({ orderBy: { nombre: "asc" } }),
      prisma.distrito.findMany({ orderBy: { nombre: "asc" } }),
      prisma.cuenca.findMany({ orderBy: { nombre: "asc" } }),
      prisma.rio.findMany({ orderBy: { nombre: "asc" } }),
      prisma.puntoMonitoreo.findMany({ orderBy: { codigo: "asc" } }),
      prisma.campana.findMany({ orderBy: { codigo: "asc" } }),
      prisma.muestreo.findMany({ orderBy: { fechaMuestreo: "desc" } }),
      prisma.medicion.findMany({ include: { parametro: true } }),
      prisma.evaluacionAmbiental.findMany({ orderBy: { evaluadoEn: "desc" } }),
      prisma.indiceSatelital.findMany({ orderBy: { fechaAdquisicion: "desc" } }),
      prisma.usuario.findMany({ orderBy: { nombre: "asc" } }),
      prisma.reporte.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.reportePuntoMonitoreo.findMany(),
    ]);

    return {
      departamentos: departamentos.map(mapDepartamento),
      provincias: provincias.map(mapProvincia),
      distritos: distritos.map(mapDistrito),
      cuencas: cuencas.map(mapCuenca),
      rios: rios.map(mapRio),
      estaciones: estaciones.map(mapEstacion),
      campanas: campanas.map(mapCampana),
      muestras: muestreos.map(mapMuestreo),
      parametros: aggregateMedicionesToParametros(muestreos, mediciones),
      clasificaciones: evaluaciones.map(mapEvaluacionAmbiental),
      indicesSatelitales: indicesSatelitales.map(mapIndiceSatelital),
      usuarios: usuarios.map(mapUsuario),
      reportes: reportes.map((reporte) => mapReporte(reporte, reporteEstaciones)),
    };
  }
}

export const prismaDataStoreLoader = new PrismaDataStoreLoader();
