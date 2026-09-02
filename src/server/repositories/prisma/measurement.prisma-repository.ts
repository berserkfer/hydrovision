/**
 * MeasurementPrismaRepository — mediciones normalizadas (muestreo + parámetro + valor)
 */

import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { CreateMeasurementInput } from "@/server/validators/schemas/crud.schemas";
import { invalidateMonitoringDataStoreCache } from "@/server/lib/invalidate-data-store-cache";
import { upsertEnvironmentalAssessmentForMuestreo } from "./eca-assessment.helper";
import {
  mapMeasurementToRow,
  type MeasurementListRow,
} from "./monitoring.mappers";
import type { MeasurementRow } from "@/server/repositories/measurement.repository";

const measurementInclude = {
  parametro: true,
  muestreo: true,
} as const;

export interface MeasurementListFilters {
  muestreoId?: string;
  parametroCodigo?: string;
}

export class MeasurementPrismaRepository {
  async findAll(filters?: MeasurementListFilters): Promise<MeasurementRow[]> {
    const rows = await prisma.measurement.findMany({
      where: {
        estado: "active",
        ...(filters?.muestreoId ? { muestreoId: filters.muestreoId } : {}),
        ...(filters?.parametroCodigo
          ? { parametro: { codigo: filters.parametroCodigo as never } }
          : {}),
      },
      orderBy: { fechaMedicion: "desc" },
      include: measurementInclude,
    });
    return rows.map((row) => mapMeasurementToRow(row as MeasurementListRow));
  }

  async findById(id: string): Promise<MeasurementRow | null> {
    const row = await prisma.measurement.findUnique({
      where: { id },
      include: measurementInclude,
    });
    if (!row || row.estado !== "active") return null;
    return mapMeasurementToRow(row as MeasurementListRow);
  }

  async create(input: CreateMeasurementInput): Promise<MeasurementRow> {
    const muestreo = await prisma.muestreo.findUnique({ where: { id: input.muestraId } });
    if (!muestreo) throw ApiError.notFound("Muestra", input.muestraId);

    const parametro = await prisma.parameter.findFirst({
      where: { codigo: input.parametroCodigo as never, estado: "active" },
    });
    if (!parametro) throw ApiError.notFound("Parámetro", input.parametroCodigo);

    const id = `meas-${Date.now()}`;
    const row = await prisma.measurement.create({
      data: {
        id,
        muestreoId: input.muestraId,
        campanaId: muestreo.campanaId,
        parametroId: parametro.id,
        puntoMonitoreoId: input.estacionId,
        valor: input.valor,
        unidad: input.unidad || parametro.unidad,
        fechaMedicion: new Date(`${input.fechaMedicion}T12:00:00.000Z`),
        metodoAnalisis: input.metodoAnalisis,
        laboratorio: input.laboratorio,
        equipoUtilizado: input.equipoUtilizado,
        observaciones: input.observaciones,
        nivelConfianza: input.nivelConfianza,
        calidadDato: "valid",
        estado: "active",
      },
      include: measurementInclude,
    });

    const station = await prisma.station.findUnique({ where: { id: input.estacionId } });
    await upsertEnvironmentalAssessmentForMuestreo(
      prisma,
      input.muestraId,
      input.estacionId,
      station?.codigo ?? input.estacionId,
      input.fechaMedicion
    );

    await invalidateMonitoringDataStoreCache();
    return mapMeasurementToRow(row as MeasurementListRow);
  }

  async update(id: string, input: Partial<CreateMeasurementInput>): Promise<MeasurementRow> {
    const existing = await prisma.measurement.findUnique({ where: { id } });
    if (!existing || existing.estado !== "active") {
      throw ApiError.notFound("Medición", id);
    }

    let parametroId = existing.parametroId;
    if (input.parametroCodigo) {
      const parametro = await prisma.parameter.findFirst({
        where: { codigo: input.parametroCodigo as never, estado: "active" },
      });
      if (!parametro) throw ApiError.notFound("Parámetro", input.parametroCodigo);
      parametroId = parametro.id;
    }

    const row = await prisma.measurement.update({
      where: { id },
      data: {
        parametroId,
        puntoMonitoreoId: input.estacionId,
        valor: input.valor,
        unidad: input.unidad,
        fechaMedicion: input.fechaMedicion
          ? new Date(`${input.fechaMedicion}T12:00:00.000Z`)
          : undefined,
        metodoAnalisis: input.metodoAnalisis,
        laboratorio: input.laboratorio,
        equipoUtilizado: input.equipoUtilizado,
        observaciones: input.observaciones,
        nivelConfianza: input.nivelConfianza,
      },
      include: measurementInclude,
    });

    const station = await prisma.station.findUnique({
      where: { id: row.puntoMonitoreoId },
    });
    await upsertEnvironmentalAssessmentForMuestreo(
      prisma,
      row.muestreoId,
      row.puntoMonitoreoId,
      station?.codigo ?? row.puntoMonitoreoId,
      row.fechaMedicion.toISOString().slice(0, 10)
    );

    await invalidateMonitoringDataStoreCache();
    return mapMeasurementToRow(row as MeasurementListRow);
  }

  async softDelete(id: string): Promise<boolean> {
    const existing = await prisma.measurement.findUnique({ where: { id } });
    if (!existing || existing.estado !== "active") return false;

    await prisma.measurement.update({
      where: { id },
      data: { estado: "inactive" },
    });

    const station = await prisma.station.findUnique({
      where: { id: existing.puntoMonitoreoId },
    });
    await upsertEnvironmentalAssessmentForMuestreo(
      prisma,
      existing.muestreoId,
      existing.puntoMonitoreoId,
      station?.codigo ?? existing.puntoMonitoreoId,
      existing.fechaMedicion.toISOString().slice(0, 10)
    );

    await invalidateMonitoringDataStoreCache();
    return true;
  }
}

export const measurementPrismaRepository = new MeasurementPrismaRepository();
