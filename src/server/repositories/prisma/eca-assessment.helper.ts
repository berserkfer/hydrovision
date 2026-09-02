/**
 * Persistencia de evaluación ECA tras muestreo/mediciones — sin alterar el clasificador.
 */

import type { PrismaClient } from "@prisma/client";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import { classifyParametros } from "@/lib/sampling/sampling-utils";

const ECA_STANDARD_ID = "eca-agua-receptores-v1";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function upsertEnvironmentalAssessmentForMuestreo(
  tx: Tx,
  muestreoId: string,
  estacionId: string,
  estacionCodigo: string,
  fechaMuestreo: string
): Promise<void> {
  const muestreo = await tx.muestreo.findUnique({ where: { id: muestreoId } });
  if (!muestreo) return;

  const mediciones = await tx.measurement.findMany({
    where: { muestreoId, estado: "active" },
    include: { parametro: true },
  });

  const [parametros] = aggregateMedicionesToParametros([muestreo], mediciones);
  if (!parametros) return;

  const result = classifyParametros(parametros, estacionCodigo, fechaMuestreo);

  await tx.environmentalAssessment.upsert({
    where: { muestreoId },
    update: {
      estado: result.status,
      parametrosViolados: result.violatedParameters,
      parametrosEnAlerta: result.alertParameters,
      evaluadoEn: new Date(),
      normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa)",
    },
    create: {
      id: `eca-${muestreoId}`,
      muestreoId,
      puntoMonitoreoId: estacionId,
      normativaId: ECA_STANDARD_ID,
      estado: result.status,
      parametrosViolados: result.violatedParameters,
      parametrosEnAlerta: result.alertParameters,
      normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa)",
      evaluadoEn: new Date(),
      observaciones: "Evaluación demostrativa — datos seed/import",
    },
  });
}
