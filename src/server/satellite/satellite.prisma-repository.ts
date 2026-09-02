/**
 * SatellitePrismaRepository — lectura de SatelliteIndex en PostgreSQL.
 * Sin NDCI en schema actual; sin reflectancias (pendiente ImagenSatelital.bandas).
 */

import { prisma } from "@/server/db";
import type { SatelliteQueryFilters } from "./satellite.types";
import type { SatelliteRepository } from "./satellite.repository";
import { mapObservationToScene, mapPrismaSatelliteIndexToObservation } from "./satellite.mappers";

function buildWhere(filters?: SatelliteQueryFilters) {
  const where: Record<string, unknown> = { estado: "active" };
  if (filters?.stationId) {
    where.puntoMonitoreoId = filters.stationId;
  }
  if (filters?.fechaInicio || filters?.fechaFin) {
    where.fechaAdquisicion = {};
    if (filters.fechaInicio) {
      (where.fechaAdquisicion as Record<string, Date>).gte = new Date(filters.fechaInicio);
    }
    if (filters.fechaFin) {
      (where.fechaAdquisicion as Record<string, Date>).lte = new Date(`${filters.fechaFin}T23:59:59.999Z`);
    }
  }
  return where;
}

export class SatellitePrismaRepository implements SatelliteRepository {
  getDataSource(): "database" {
    return "database";
  }

  async findObservations(filters?: SatelliteQueryFilters) {
    const rows = await prisma.satelliteIndex.findMany({
      where: buildWhere(filters),
      orderBy: { fechaAdquisicion: "desc" },
      take: 200,
    });
    return rows.map(mapPrismaSatelliteIndexToObservation);
  }

  async findObservationById(id: string) {
    const row = await prisma.satelliteIndex.findUnique({ where: { id } });
    return row ? mapPrismaSatelliteIndexToObservation(row) : null;
  }

  async findScenes(filters?: SatelliteQueryFilters) {
    const observations = await this.findObservations(filters);
    return observations.map(mapObservationToScene);
  }
}

export const satellitePrismaRepository = new SatellitePrismaRepository();
