import type { EstadoCampana } from "@/constants/enums";

/** Resumen de campaña para listados y tarjetas */
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
  muestraCount: number;
  estado: EstadoCampana;
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
  observaciones: string;
}

/** Filtros del listado de campañas */
export interface CampaignFilters {
  search: string;
  fecha: string;
  responsableId: string;
  cuencaId: string;
  estado: string;
}

export const DEFAULT_CAMPAIGN_FILTERS: CampaignFilters = {
  search: "",
  fecha: "",
  responsableId: "",
  cuencaId: "",
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

/** Vista detalle completa de una campaña */
export interface CampanaDetail extends CampanaSummary {
  objetivo: string;
  estaciones: CampanaEstacionInfo[];
  createdAt: string;
  updatedAt: string;
}

/** Opción genérica para selects */
export interface SelectOption {
  value: string;
  label: string;
}
