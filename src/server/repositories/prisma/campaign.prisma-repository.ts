/**
 * CampaignPrismaRepository — PostgreSQL para campañas de monitoreo
 */

import { prisma } from "@/server/db";
import type { CampanaDetail, CampanaSummary, CampaignStats, CreateCampanaInput } from "@/types/campaign";
import { invalidateMonitoringDataStoreCache } from "@/server/lib/invalidate-data-store-cache";
import {
  addMonths,
  mapCampaignStats,
  mapCampaignToDetail,
  mapCampaignToSummary,
  type CampaignListRow,
} from "./monitoring.mappers";

const campaignInclude = {
  rio: true,
  cuenca: true,
  responsable: true,
  muestreos: { select: { id: true, puntoMonitoreoId: true } },
  mediciones: { select: { id: true } },
} as const;

export class CampaignPrismaRepository {
  async findAll(): Promise<CampanaSummary[]> {
    const rows = await prisma.campaign.findMany({
      where: { NOT: { estado: "cancelled" } },
      orderBy: { fechaInicio: "desc" },
      include: campaignInclude,
    });
    return rows.map((row) => mapCampaignToSummary(row as CampaignListRow));
  }

  async findDetailById(id: string): Promise<CampanaDetail | null> {
    const row = await prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
    if (!row || row.estado === "cancelled") return null;

    const muestreos = await prisma.muestreo.findMany({ where: { campanaId: id } });
    const stationIds = [...new Set(muestreos.map((m) => m.puntoMonitoreoId))];

    const [mediciones, evaluaciones, estaciones] = await Promise.all([
      prisma.measurement.findMany({
        where: { campanaId: id, estado: "active" },
        include: { parametro: true },
      }),
      prisma.environmentalAssessment.findMany({
        where: { muestreo: { campanaId: id } },
      }),
      stationIds.length > 0
        ? prisma.station.findMany({
            where: {
              id: { in: stationIds },
              estadoRegistro: "active",
            },
          })
        : Promise.resolve([]),
    ]);

    return mapCampaignToDetail(
      row as CampaignListRow,
      estaciones,
      muestreos,
      mediciones,
      evaluaciones
    );
  }

  async getStats(): Promise<CampaignStats> {
    const campaigns = await prisma.campaign.findMany({
      where: { NOT: { estado: "cancelled" } },
    });
    return mapCampaignStats(campaigns);
  }

  async create(input: CreateCampanaInput): Promise<CampanaSummary> {
    const year = new Date().getFullYear();
    const count = await prisma.campaign.count();
    const id = `camp-${Date.now()}`;
    const codigo = `CAMP-${year}-${String(count + 1).padStart(2, "0")}`;

    const row = await prisma.campaign.create({
      data: {
        id,
        codigo,
        nombre: input.nombre.trim(),
        rioId: input.rioId,
        cuencaId: input.cuencaId,
        fechaInicio: new Date(`${input.fecha}T12:00:00.000Z`),
        fechaFin: new Date(`${addMonths(input.fecha, 2)}T12:00:00.000Z`),
        responsableId: input.responsableId,
        estado: "planned",
        objetivo: input.objetivo.trim() || "Sin objetivo registrado.",
        observaciones: input.observaciones.trim() || input.descripcion.trim(),
      },
      include: campaignInclude,
    });

    await invalidateMonitoringDataStoreCache();
    return mapCampaignToSummary(row as CampaignListRow, input.estacionIds.length);
  }

  async update(id: string, input: CreateCampanaInput): Promise<CampanaSummary | null> {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing || existing.estado === "cancelled") return null;

    const row = await prisma.campaign.update({
      where: { id },
      data: {
        nombre: input.nombre.trim(),
        rioId: input.rioId,
        cuencaId: input.cuencaId,
        fechaInicio: new Date(`${input.fecha}T12:00:00.000Z`),
        fechaFin: new Date(`${addMonths(input.fecha, 2)}T12:00:00.000Z`),
        responsableId: input.responsableId,
        objetivo: input.objetivo.trim(),
        observaciones: input.observaciones.trim() || input.descripcion.trim(),
      },
      include: campaignInclude,
    });

    await invalidateMonitoringDataStoreCache();
    return mapCampaignToSummary(row as CampaignListRow, input.estacionIds.length);
  }

  async softDelete(id: string): Promise<boolean> {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing || existing.estado === "cancelled") return false;

    await prisma.campaign.update({
      where: { id },
      data: { estado: "cancelled" },
    });

    await invalidateMonitoringDataStoreCache();
    return true;
  }
}

export const campaignPrismaRepository = new CampaignPrismaRepository();
