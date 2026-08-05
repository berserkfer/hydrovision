import type { EntityMeta } from "./base";
import type { EstadoReporte } from "@/constants/enums";

/**
 * Reporte técnico generado a partir de datos de monitoreo.
 * Preparado para exportación PDF (Fase 5).
 */
export interface Reporte extends EntityMeta {
  id: string;
  titulo: string;
  rioId: string;
  cuencaId: string;
  estacionIds: string[];
  fechaInicio: string;
  fechaFin: string;
  generadoPorId: string;
  estado: EstadoReporte;
  resumen: string;
}
