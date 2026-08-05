/**
 * Interfaces de repositorios PostgreSQL — Fase 5.0
 */

import type { HydroVisionDataStore } from "@/models";

/** Carga el almacén completo desde PostgreSQL */
export interface IDataStoreLoader {
  loadStore(): Promise<HydroVisionDataStore>;
}

/** Geografía — departamentos, cuencas, ríos */
export interface IGeographyRepository {
  findAllDepartamentos(): Promise<HydroVisionDataStore["departamentos"]>;
  findAllCuencas(): Promise<HydroVisionDataStore["cuencas"]>;
  findAllRios(): Promise<HydroVisionDataStore["rios"]>;
}

/** Monitoreo — estaciones, campañas, muestreos */
export interface IMonitoringRepository {
  findAllEstaciones(): Promise<HydroVisionDataStore["estaciones"]>;
  findAllCampanas(): Promise<HydroVisionDataStore["campanas"]>;
  findAllMuestras(): Promise<HydroVisionDataStore["muestras"]>;
  findAllParametros(): Promise<HydroVisionDataStore["parametros"]>;
  findAllClasificaciones(): Promise<HydroVisionDataStore["clasificaciones"]>;
}

/** Satélite, usuarios y reportes */
export interface IAncillaryRepository {
  findAllIndicesSatelitales(): Promise<HydroVisionDataStore["indicesSatelitales"]>;
  findAllUsuarios(): Promise<HydroVisionDataStore["usuarios"]>;
  findAllReportes(): Promise<HydroVisionDataStore["reportes"]>;
}

export type {
  IDataProvider,
  DataProviderMetadata,
  DataProviderSnapshot,
} from "@/types/data-provider";
