import type { EntityMeta, Coordenadas } from "./base";
import type { EstadoEstacion } from "@/constants/enums";

/**
 * Estación de monitoreo — punto de muestreo en un río.
 * Entidad central del sistema HydroVision.
 */
export interface Estacion extends EntityMeta {
  id: string;
  codigo: string;
  nombre: string;
  rioId: string;
  cuencaId: string;
  coordenadas: Coordenadas;
  altitud: number;
  tramo: string;
  descripcion: string;
  fechaInstalacion: string;
  estadoOperativo: EstadoEstacion;
  ultimaActualizacion: string;
}
