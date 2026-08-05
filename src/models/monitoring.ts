import type { EntityMeta } from "./base";
import type { EstadoCampana } from "@/constants/enums";

/**
 * Campaña de monitoreo — periodo planificado de muestreo en campo.
 */
export interface CampanaMonitoreo extends EntityMeta {
  id: string;
  /** Código legible de la campaña (ej. CAMP-2025-01) */
  codigo: string;
  nombre: string;
  rioId: string;
  cuencaId: string;
  fechaInicio: string;
  fechaFin: string;
  responsableId: string;
  estado: EstadoCampana;
  /** Objetivo u observaciones de la campaña */
  objetivo: string;
}

/**
 * Muestra — registro de muestreo en una estación dentro de una campaña.
 */
export interface Muestra extends EntityMeta {
  id: string;
  campanaId: string;
  estacionId: string;
  codigoMuestra: string;
  fechaMuestreo: string;
  responsableId: string;
  /** Condición climática al momento del muestreo */
  clima: string;
  /** Color aparente del agua (escala visual) */
  colorAparente: string;
  observaciones?: string;
}

/**
 * Parámetros fisicoquímicos medidos en una muestra de agua.
 */
export interface ParametrosFisicoquimicos extends EntityMeta {
  id: string;
  muestraId: string;
  estacionId: string;
  ph: number;
  turbidez: number;
  conductividad: number;
  oxigenoDisuelto: number;
  temperatura: number;
  dbo5: number;
  dqo: number;
  coliformes?: number;
  solidosDisueltosTotales: number;
  caudal: number;
}
