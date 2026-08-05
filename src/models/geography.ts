import type { EntityMeta } from "./base";

/**
 * Departamento — división política de primer nivel (Perú).
 * @example Lambayeque, La Libertad
 */
export interface Departamento extends EntityMeta {
  id: string;
  nombre: string;
  codigo: string;
}

/**
 * Provincia — subdivisión del departamento.
 */
export interface Provincia extends EntityMeta {
  id: string;
  departamentoId: string;
  nombre: string;
}

/**
 * Distrito — subdivisión de la provincia.
 */
export interface Distrito extends EntityMeta {
  id: string;
  provinciaId: string;
  nombre: string;
}

/**
 * Cuenca hidrográfica — unidad de gestión de recursos hídricos.
 */
export interface Cuenca extends EntityMeta {
  id: string;
  distritoId: string;
  nombre: string;
  /** Área aproximada en km² (simulada) */
  areaKm2: number;
}

/**
 * Río — cuerpo de agua dentro de una cuenca.
 */
export interface Rio extends EntityMeta {
  id: string;
  cuencaId: string;
  nombre: string;
  centro: import("./base").CentroMapa;
  /** Longitud aproximada del tramo monitoreado (km) */
  longitudKm: number;
}
