/**
 * PrismaGeographyRepository — acceso geográfico PostgreSQL
 */

import type { HydroVisionDataStore } from "@/models";
import type { IGeographyRepository } from "@/database/interfaces";
import { PrismaService } from "@/database/prisma.service";
import { mapCuenca, mapDepartamento, mapRio } from "@/database/mappers/hydrovision-store.mapper";

export class PrismaGeographyRepository implements IGeographyRepository {
  async findAllDepartamentos(): Promise<HydroVisionDataStore["departamentos"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.department.findMany({
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapDepartamento);
  }

  async findAllCuencas(): Promise<HydroVisionDataStore["cuencas"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.watershed.findMany({
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapCuenca);
  }

  async findAllRios(): Promise<HydroVisionDataStore["rios"]> {
    const prisma = await PrismaService.getClient();
    const rows = await prisma.river.findMany({
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapRio);
  }
}

export const prismaGeographyRepository = new PrismaGeographyRepository();
