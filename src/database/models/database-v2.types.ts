/**
 * Tipos de dominio DB v2 — referencia TypeScript (Fase 5.1)
 * No consumir desde UI; usar HydroVisionDataStore + mapper.
 */

export type EstadoRegistroDb = "active" | "inactive" | "archived";
export type TipoCuerpoAguaDb = "river" | "stream" | "canal" | "reservoir" | "lagoon";
export type EstadoMuestreoDb = "registered" | "validated" | "rejected";
export type EstadoNormativaDb = "draft" | "active" | "revoked";

/** Metadatos comunes v2 en todas las entidades principales */
export interface EntityAuditFields {
  createdAt: Date;
  updatedAt: Date;
  estado: EstadoRegistroDb;
  observaciones?: string | null;
}

/** Punto de Monitoreo — shape DB (Prisma PuntoMonitoreo) */
export interface PuntoMonitoreoDb extends EntityAuditFields {
  id: string;
  codigo: string;
  nombre: string;
  latitude: number;
  longitude: number;
  altitud: number;
  departamentoId: string;
  provinciaId: string;
  distritoId: string;
  tipoCuerpoAgua: TipoCuerpoAguaDb;
  fotografiaUrl?: string | null;
  cuencaId: string;
  subcuencaId?: string | null;
  rioId?: string | null;
  quebradaId?: string | null;
}

/** Medición — shape DB normalizado */
export interface MedicionDb extends EntityAuditFields {
  id: string;
  valor: number;
  unidad: string;
  fechaMedicion: Date;
  metodoAnalisis?: string | null;
  laboratorio?: string | null;
  responsableId?: string | null;
  muestreoId: string;
  parametroId: string;
  puntoMonitoreoId: string;
}

/** Índice satelital — preparado GEE */
export interface IndiceSatelitalDb extends EntityAuditFields {
  id: string;
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
  temperaturaSuperficial?: number | null;
  coberturaVegetal?: number | null;
  coberturaNubosa: number;
  puntoMonitoreoId: string;
  proyectoId?: string | null;
}

/** Evaluación ambiental — preparado IA */
export interface EvaluacionAmbientalDb extends EntityAuditFields {
  id: string;
  scoreRiesgo?: number | null;
  nivelAlerta?: "low" | "medium" | "high" | "critical" | null;
  modelVersion?: string | null;
  normativaId?: string | null;
}
