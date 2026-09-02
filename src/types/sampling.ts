import type { ComplianceStatus } from "@/types";
import type { EstadoECA } from "@/constants/enums";

/** Resumen de muestra para tablas */
export interface MuestraSummary {
  id: string;
  codigoMuestra: string;
  fechaMuestreo: string;
  campanaId: string;
  campanaNombre: string;
  campanaCodigo: string;
  estacionId: string;
  estacionCodigo: string;
  estacionNombre: string;
  responsableId: string;
  responsableNombre: string;
  estadoECA: ComplianceStatus;
  clima: string;
  colorAparente: string;
}

/** Parámetros fisicoquímicos para UI */
export interface MuestraParametros {
  ph?: number;
  temperatura?: number;
  conductividad?: number;
  oxigenoDisuelto?: number;
  turbidez?: number;
  solidosDisueltosTotales?: number;
  caudal?: number;
  colorAparente: string;
}

/** Vista detalle completa */
export interface MuestraDetail extends MuestraSummary {
  observaciones: string;
  parametros: MuestraParametros;
  parametrosViolados: string[];
  parametrosEnAlerta: string[];
  normativaReferencia: string;
  evaluadoEn: string;
  createdAt: string;
  updatedAt: string;
}

/** Estadísticas del módulo de muestreos */
export interface SampleStats {
  total: number;
  cumple: number;
  alerta: number;
  noCumple: number;
}

/** Input del formulario de registro/edición */
export interface SampleFormInput {
  campanaId: string;
  fecha: string;
  hora: string;
  estacionId: string;
  responsableId: string;
  clima: string;
  observaciones: string;
  colorAparente: string;
  ph: string;
  temperatura: string;
  conductividad: string;
  oxigenoDisuelto: string;
  turbidez: string;
  solidosDisueltosTotales: string;
  caudal: string;
}

export const EMPTY_SAMPLE_FORM: SampleFormInput = {
  campanaId: "",
  fecha: "",
  hora: "",
  estacionId: "",
  responsableId: "",
  clima: "",
  observaciones: "",
  colorAparente: "",
  ph: "",
  temperatura: "",
  conductividad: "",
  oxigenoDisuelto: "",
  turbidez: "",
  solidosDisueltosTotales: "",
  caudal: "",
};

/** Errores de validación del formulario */
export type SampleFormErrors = Partial<Record<keyof SampleFormInput, string>>;

/** Payload interno tras validación */
export interface CreateMuestraPayload {
  campanaId: string;
  fechaMuestreo: string;
  estacionId: string;
  responsableId: string;
  clima: string;
  colorAparente: string;
  observaciones: string;
  ph: number;
  temperatura: number;
  conductividad: number;
  oxigenoDisuelto: number;
  turbidez: number;
  solidosDisueltosTotales: number;
  caudal: number;
}

/** Resultado de operación CRUD */
export interface SampleOperationResult {
  success: boolean;
  message: string;
  sample?: MuestraSummary;
}

export function estadoECAToCompliance(estado: EstadoECA): ComplianceStatus {
  return estado as ComplianceStatus;
}
