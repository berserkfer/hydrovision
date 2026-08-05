import type { EntityMeta } from "./base";
import type { RolUsuario } from "@/constants/enums";

/**
 * Usuario del sistema HydroVision.
 * Preparado para autenticación institucional (Fase posterior).
 */
export interface Usuario extends EntityMeta {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  institucion: string;
  activo: boolean;
}
