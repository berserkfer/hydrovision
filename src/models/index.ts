/**
 * Modelos de dominio HydroVision — Fase 3.0
 * Representan las entidades principales del sistema ambiental.
 */

export type { EntityMeta, Coordenadas, CentroMapa } from "./base";
export type { Departamento, Provincia, Distrito, Cuenca, Rio } from "./geography";
export type { Estacion } from "./station";
export type { CampanaMonitoreo, Muestra, ParametrosFisicoquimicos } from "./monitoring";
export type { ClasificacionECA } from "./compliance";
export type { IndicesSatelitales } from "./satellite";
export type { Usuario } from "./user";
export type { Reporte } from "./report";

/** Contenedor raíz del modelo de datos mock */
export interface HydroVisionDataStore {
  departamentos: import("./geography").Departamento[];
  provincias: import("./geography").Provincia[];
  distritos: import("./geography").Distrito[];
  cuencas: import("./geography").Cuenca[];
  rios: import("./geography").Rio[];
  estaciones: import("./station").Estacion[];
  campanas: import("./monitoring").CampanaMonitoreo[];
  muestras: import("./monitoring").Muestra[];
  parametros: import("./monitoring").ParametrosFisicoquimicos[];
  clasificaciones: import("./compliance").ClasificacionECA[];
  indicesSatelitales: import("./satellite").IndicesSatelitales[];
  usuarios: import("./user").Usuario[];
  reportes: import("./report").Reporte[];
}
