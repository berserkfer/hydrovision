/**
 * Esquemas Zod para formularios cliente — Sprint 3E
 */

import { z } from "zod";

function requiredNumber(min: number, max?: number) {
  const base = max !== undefined ? z.number().min(min).max(max) : z.number().min(min);
  return z.preprocess((val) => Number(val), base);
}

function optionalNumber() {
  return z.preprocess((val) => {
    if (val === "" || val == null) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }, z.number().optional());
}

export const campaignFormSchema = z.object({
  nombre: z.string().trim().min(3, "Nombre obligatorio"),
  responsableId: z.string().min(1, "Responsable obligatorio"),
  fecha: z.string().min(1, "Fecha obligatoria"),
  cuencaId: z.string().min(1, "Cuenca obligatoria"),
  rioId: z.string().min(1, "Río obligatorio"),
  objetivo: z.string().trim().min(5, "Objetivo obligatorio"),
  descripcion: z.string().optional(),
  estacionIds: z.array(z.string()),
  observaciones: z.string().optional(),
});

export const sampleFormSchema = z.object({
  campanaId: z.string().min(1, "Campaña obligatoria"),
  fecha: z.string().min(1, "Fecha obligatoria"),
  hora: z.string().min(1, "Hora obligatoria"),
  estacionId: z.string().min(1, "Estación obligatoria"),
  responsableId: z.string().min(1, "Responsable obligatorio"),
  clima: z.string().min(1, "Clima obligatorio"),
  colorAparente: z.string().min(1, "Color aparente obligatorio"),
  observaciones: z.string().min(1, "Observaciones obligatorias"),
  ph: requiredNumber(0, 14),
  turbidez: requiredNumber(0),
  conductividad: requiredNumber(0),
  oxigenoDisuelto: requiredNumber(0),
  temperatura: requiredNumber(-5, 50),
  solidosDisueltosTotales: requiredNumber(0),
  caudal: requiredNumber(0),
});

export const stationFormSchema = z.object({
  codigo: z.string().trim().min(2, "Código obligatorio").max(10),
  nombre: z.string().trim().min(3, "Nombre obligatorio").max(200),
  cuencaId: z.string().min(1, "Cuenca obligatoria"),
  rioId: z.string().min(1, "Río obligatorio"),
  tramo: z.string().trim().min(2, "Tramo obligatorio"),
  altitud: requiredNumber(0, 7000),
  latitud: requiredNumber(-90, 90),
  longitud: requiredNumber(-180, 180),
  estado: z.enum(["active", "maintenance", "offline"]),
  descripcion: z.string().max(2000).optional(),
  entidadResponsable: z.string().max(200).optional(),
});

export const parameterFormSchema = z.object({
  codigo: z.string().trim().min(2, "Código obligatorio").max(30),
  nombre: z.string().trim().min(2, "Nombre obligatorio").max(120),
  unidad: z.string().trim().min(1, "Unidad obligatoria").max(30),
  descripcion: z.string().max(500).optional(),
  limiteEcaMin: optionalNumber(),
  limiteEcaMax: optionalNumber(),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type SampleFormValues = z.infer<typeof sampleFormSchema>;
export type StationFormValues = z.infer<typeof stationFormSchema>;
export type ParameterFormValues = z.infer<typeof parameterFormSchema>;
