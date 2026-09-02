/**
 * SamplePrismaRepository — muestreos con mediciones normalizadas
 */

import { prisma } from "@/server/db";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import { generateCodigoMuestra } from "@/lib/sampling/sampling-utils";
import type { CreateMuestraPayload, MuestraDetail, MuestraSummary, SampleOperationResult, SampleStats } from "@/types/sampling";
import { invalidateMonitoringDataStoreCache } from "@/server/lib/invalidate-data-store-cache";
import { upsertEnvironmentalAssessmentForMuestreo } from "./eca-assessment.helper";
import {
  mapMuestreoToDetail,
  mapMuestreoToSummary,
  mapSampleStats,
  SAMPLE_PAYLOAD_TO_PARAM_CODE,
  type MuestreoListRow,
} from "./monitoring.mappers";

const muestreoInclude = {
  campana: true,
  puntoMonitoreo: true,
  responsable: true,
  evaluacion: true,
} as const;

async function upsertMeasurementsForPayload(
  muestreoId: string,
  campanaId: string,
  estacionId: string,
  payload: CreateMuestraPayload,
  fechaMedicion: Date
): Promise<void> {
  const parameters = await prisma.parameter.findMany({ where: { estado: "active" } });
  const byCode = new Map(parameters.map((p) => [p.codigo, p]));

  for (const [field, code] of SAMPLE_PAYLOAD_TO_PARAM_CODE) {
    const parametro = byCode.get(code);
    if (!parametro) continue;

    const valor = payload[field];
    if (typeof valor !== "number") continue;

    await prisma.measurement.upsert({
      where: {
        muestreoId_parametroId: { muestreoId, parametroId: parametro.id },
      },
      update: {
        valor,
        unidad: parametro.unidad,
        fechaMedicion,
        estado: "active",
      },
      create: {
        id: `med-${muestreoId}-${code}`,
        muestreoId,
        campanaId,
        parametroId: parametro.id,
        puntoMonitoreoId: estacionId,
        valor,
        unidad: parametro.unidad,
        fechaMedicion,
        responsableId: payload.responsableId,
        calidadDato: "valid",
        estado: "active",
        observaciones: "Registro demostrativo — HydroVision",
      },
    });
  }
}

export class SamplePrismaRepository {
  async findAll(campanaId?: string): Promise<MuestraSummary[]> {
    const rows = await prisma.muestreo.findMany({
      where: campanaId ? { campanaId } : undefined,
      orderBy: { fechaMuestreo: "desc" },
      include: muestreoInclude,
    });
    return rows.map((row) => mapMuestreoToSummary(row as MuestreoListRow));
  }

  async findById(id: string): Promise<MuestraDetail | null> {
    const row = await prisma.muestreo.findUnique({
      where: { id },
      include: muestreoInclude,
    });
    if (!row) return null;

    const mediciones = await prisma.measurement.findMany({
      where: { muestreoId: id, estado: "active" },
      include: { parametro: true },
    });
    const [parametros] = aggregateMedicionesToParametros([row], mediciones);
    if (!parametros) return null;

    return mapMuestreoToDetail(row as MuestreoListRow, parametros);
  }

  async getStats(campanaId?: string): Promise<SampleStats> {
    const summaries = await this.findAll(campanaId);
    return mapSampleStats(summaries);
  }

  async create(payload: CreateMuestraPayload): Promise<SampleOperationResult> {
    const campana = await prisma.campaign.findUnique({ where: { id: payload.campanaId } });
    const estacion = await prisma.station.findUnique({ where: { id: payload.estacionId } });

    if (!campana) return { success: false, message: "La campaña seleccionada no existe." };
    if (!estacion || estacion.rioId !== campana.rioId) {
      return { success: false, message: "La estación no pertenece a la campaña seleccionada." };
    }

    const fechaPart = payload.fechaMuestreo.slice(0, 10);
    const codigoBase = generateCodigoMuestra(estacion.codigo, fechaPart);
    const existingCount = await prisma.muestreo.count({
      where: { codigoMuestra: { startsWith: codigoBase } },
    });
    const codigoMuestra =
      existingCount > 0 ? `${codigoBase}-${existingCount + 1}` : codigoBase;

    const muestreoId = `muestreo-${Date.now()}`;
    const fechaMedicion = new Date(payload.fechaMuestreo);

    const row = await prisma.muestreo.create({
      data: {
        id: muestreoId,
        campanaId: payload.campanaId,
        puntoMonitoreoId: payload.estacionId,
        codigoMuestra,
        fechaMuestreo: fechaMedicion,
        responsableId: payload.responsableId,
        clima: payload.clima,
        colorAparente: payload.colorAparente,
        observaciones: payload.observaciones,
        estado: "registered",
      },
      include: muestreoInclude,
    });

    await upsertMeasurementsForPayload(
      muestreoId,
      payload.campanaId,
      payload.estacionId,
      payload,
      fechaMedicion
    );

    await upsertEnvironmentalAssessmentForMuestreo(
      prisma,
      muestreoId,
      payload.estacionId,
      estacion.codigo,
      fechaPart
    );

    await invalidateMonitoringDataStoreCache();

    return {
      success: true,
      message: `Muestra ${codigoMuestra} registrada correctamente.`,
      sample: mapMuestreoToSummary(row as MuestreoListRow),
    };
  }

  async update(id: string, payload: CreateMuestraPayload): Promise<SampleOperationResult> {
    const existing = await prisma.muestreo.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "La muestra no existe." };

    const campana = await prisma.campaign.findUnique({ where: { id: payload.campanaId } });
    const estacion = await prisma.station.findUnique({ where: { id: payload.estacionId } });
    if (!campana || !estacion || estacion.rioId !== campana.rioId) {
      return { success: false, message: "Campaña o estación no válida." };
    }

    const fechaMedicion = new Date(payload.fechaMuestreo);
    const row = await prisma.muestreo.update({
      where: { id },
      data: {
        campanaId: payload.campanaId,
        puntoMonitoreoId: payload.estacionId,
        fechaMuestreo: fechaMedicion,
        responsableId: payload.responsableId,
        clima: payload.clima,
        colorAparente: payload.colorAparente,
        observaciones: payload.observaciones,
      },
      include: muestreoInclude,
    });

    await upsertMeasurementsForPayload(
      id,
      payload.campanaId,
      payload.estacionId,
      payload,
      fechaMedicion
    );

    await upsertEnvironmentalAssessmentForMuestreo(
      prisma,
      id,
      payload.estacionId,
      estacion.codigo,
      payload.fechaMuestreo.slice(0, 10)
    );

    await invalidateMonitoringDataStoreCache();

    return {
      success: true,
      message: `Muestra ${existing.codigoMuestra} actualizada correctamente.`,
      sample: mapMuestreoToSummary(row as MuestreoListRow),
    };
  }

  async softDelete(id: string): Promise<MuestraDetail | null> {
    const detail = await this.findById(id);
    if (!detail) return null;

    await prisma.muestreo.delete({ where: { id } });
    await invalidateMonitoringDataStoreCache();
    return detail;
  }
}

export const samplePrismaRepository = new SamplePrismaRepository();
