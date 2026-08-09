/**
 * Esquemas Zod — Sprint 3E
 */

import { z } from "zod";
import { ApiError } from "@/server/api/errors";

const coordinatesSchema = z.object({
  latitud: z.number().min(-90, "Latitud inválida").max(90, "Latitud inválida"),
  longitud: z.number().min(-180, "Longitud inválida").max(180, "Longitud inválida"),
});

export const createStationSchema = z
  .object({
    codigo: z.string().trim().min(2, "Código obligatorio").max(10),
    nombre: z.string().trim().min(3, "Nombre obligatorio").max(200),
    cuencaId: z.string().min(1, "Cuenca obligatoria"),
    rioId: z.string().min(1, "Río obligatorio"),
    tramo: z.string().trim().min(2, "Tramo obligatorio"),
    altitud: z.number().min(0).max(7000),
    estado: z.enum(["active", "maintenance", "offline"]).default("active"),
    descripcion: z.string().max(2000).optional(),
    entidadResponsable: z.string().max(200).optional(),
  })
  .merge(coordinatesSchema);

export const updateStationSchema = createStationSchema.partial().extend({
  id: z.string().min(1),
});

export const createCampaignSchema = z.object({
  nombre: z.string().trim().min(3, "Nombre obligatorio"),
  responsableId: z.string().min(1, "Responsable obligatorio"),
  fecha: z.string().min(1, "Fecha obligatoria"),
  cuencaId: z.string().min(1, "Cuenca obligatoria"),
  rioId: z.string().min(1, "Río obligatorio"),
  objetivo: z.string().trim().min(5, "Objetivo obligatorio"),
  descripcion: z.string().default(""),
  estacionIds: z.array(z.string()).default([]),
  observaciones: z.string().default(""),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({ id: z.string() });

export const createSampleSchema = z.object({
  campanaId: z.string().min(1, "Campaña obligatoria"),
  estacionId: z.string().min(1, "Estación obligatoria"),
  fechaMuestreo: z.string().min(1, "Fecha obligatoria"),
  responsableId: z.string().min(1, "Responsable obligatorio"),
  clima: z.string().min(1, "Clima obligatorio"),
  colorAparente: z.string().min(1, "Color aparente obligatorio"),
  ph: z.number().min(0).max(14),
  turbidez: z.number().min(0),
  conductividad: z.number().min(0),
  oxigenoDisuelto: z.number().min(0),
  temperatura: z.number().min(-5).max(50),
  solidosDisueltosTotales: z.number().min(0),
  caudal: z.number().min(0),
  observaciones: z.string().default(""),
});

export const updateSampleSchema = createSampleSchema.partial().extend({ id: z.string() });

export const createParameterSchema = z.object({
  codigo: z.string().trim().min(2).max(30),
  nombre: z.string().trim().min(2).max(120),
  unidad: z.string().trim().min(1).max(30),
  descripcion: z.string().max(500).optional(),
  limiteEcaMin: z.number().optional(),
  limiteEcaMax: z.number().optional(),
});

export const updateParameterSchema = createParameterSchema.partial().extend({ id: z.string() });

export const createMeasurementSchema = z.object({
  muestraId: z.string().min(1),
  estacionId: z.string().min(1),
  parametroCodigo: z.string().min(1),
  parametroNombre: z.string().min(1),
  valor: z.number(),
  unidad: z.string().min(1),
  fechaMedicion: z.string().min(1),
  metodoAnalisis: z.string().optional(),
  laboratorio: z.string().optional(),
  equipoUtilizado: z.string().optional(),
  observaciones: z.string().optional(),
  nivelConfianza: z.enum(["high", "medium", "low", "estimated"]).optional(),
});

export const updateMeasurementSchema = createMeasurementSchema.partial().extend({ id: z.string() });

export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateSampleInput = z.infer<typeof createSampleSchema>;
export type CreateParameterInput = z.infer<typeof createParameterSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw ApiError.validation(
      result.error.issues[0]?.message ?? "Datos inválidos",
      result.error.issues
    );
  }
  return result.data;
}
