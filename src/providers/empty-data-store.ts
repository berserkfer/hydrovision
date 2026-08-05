import type { HydroVisionDataStore } from "@/models";

/** Almacén vacío con la misma forma que HydroVisionDataStore */
export function createEmptyDataStore(): HydroVisionDataStore {
  return {
    departamentos: [],
    provincias: [],
    distritos: [],
    cuencas: [],
    rios: [],
    estaciones: [],
    campanas: [],
    muestras: [],
    parametros: [],
    clasificaciones: [],
    indicesSatelitales: [],
    usuarios: [],
    reportes: [],
  };
}
