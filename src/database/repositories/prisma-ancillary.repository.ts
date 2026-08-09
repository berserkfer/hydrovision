/**
 * PrismaAncillaryRepository — satélite, usuarios y reportes
 */

import type { HydroVisionDataStore } from "@/models";
import type { IAncillaryRepository } from "@/database/interfaces";
import { PrismaService } from "@/database/prisma.service";
import { mapIndiceSatelital, mapReporte, mapUsuario } from "@/database/mappers/hydrovision-store.mapper";

export class PrismaAncillaryRepository implements IAncillaryRepository {
  async findAllIndicesSatelitales(): Promise<HydroVisionDataStore["indicesSatelitales"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.satelliteIndex.findMany({
      orderBy: { fechaAdquisicion: "desc" },
    });
    return rows.map(mapIndiceSatelital);
  }

  async findAllUsuarios(): Promise<HydroVisionDataStore["usuarios"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapUsuario);
  }

  async findAllReportes(): Promise<HydroVisionDataStore["reportes"]> {
    const prisma = await PrismaService.getClient();
    const [reportes, links] = await Promise.all([
      prisma.reporte.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.reportePuntoMonitoreo.findMany(),
    ]);
    return reportes.map((reporte) => mapReporte(reporte, links));
  }
}

export const prismaAncillaryRepository = new PrismaAncillaryRepository();
