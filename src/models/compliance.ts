import type { EntityMeta } from "./base";
import type { EstadoECA, TipoParametro } from "@/constants/enums";

/**
 * Clasificación ECA resultante de evaluar parámetros de una muestra.
 */
export interface ClasificacionECA extends EntityMeta {
  id: string;
  muestraId: string;
  estacionId: string;
  estado: EstadoECA;
  parametrosViolados: TipoParametro[];
  parametrosEnAlerta: TipoParametro[];
  evaluadoEn: string;
  normativaReferencia: string;
}
