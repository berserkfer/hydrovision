import type { EstadoCampana } from "@/constants/enums";
import type { ComplianceStatus } from "@/types";

/** Resumen de campaña para listados y tarjetas — Sprint 2D */
export interface CampanaSummary {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  responsableId: string;
  responsableNombre: string;
  cuencaId: string;
  cuencaNombre: string;
  rioId: string;
  rioNombre: string;
  estacionCount: number;
  parametroCount: number;
  muestraCount: number;
  estado: EstadoCampana;
  observaciones: string;
}

/** Estadísticas agregadas del módulo de campañas */
export interface CampaignStats {
  total: number;
  enCurso: number;
  planificadas: number;
  finalizadas: number;
  canceladas: number;
}

/** Datos del formulario de nueva campaña */
export interface CreateCampanaInput {
  nombre: string;
  responsableId: string;
  fecha: string;
  cuencaId: string;
  rioId: string;
  objetivo: string;
  descripcion: string;
  estacionIds: string[];
  observaciones: string;
}

/** Filtros del listado de campañas */
export interface CampaignFilters {
  search: string;
  year: string;
  month: string;
  responsableId: string;
  estado: string;
}

export const DEFAULT_CAMPAIGN_FILTERS: CampaignFilters = {
  search: "",
  year: "",
  month: "",
  responsableId: "",
  estado: "",
};

/** Estación asociada a una campaña (vista detalle) */
export interface CampanaEstacionInfo {
  id: string;
  codigo: string;
  nombre: string;
  tramo: string;
  estadoOperativo: string;
}

/** Parámetro agregado en campaña */
export interface CampanaParametroResumen {
  key: string;
  label: string;
  unit: string;
  promedio: number;
  min: number;
  max: number;
}

/** Resumen ECA de la campaña */
export interface CampanaEcaResumen {
  cumple: number;
  enAlerta: number;
  noCumple: number;
  total: number;
}

/** Punto para gráficos de la campaña */
export interface CampanaChartPoint {
  label: string;
  value: number;
}

/** Vista detalle completa de una campaña */
export interface CampanaDetail extends CampanaSummary {
  objetivo: string;
  descripcion: string;
  estaciones: CampanaEstacionInfo[];
  parametros: CampanaParametroResumen[];
  ecaResumen: CampanaEcaResumen;
  muestrasPorMes: CampanaChartPoint[];
  ecaPorEstado: CampanaChartPoint[];
  createdAt: string;
  updatedAt: string;
}

/** Opción genérica para selects */
export interface SelectOption {
  value: string;
  label: string;
}

export type { ComplianceStatus };
