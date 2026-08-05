import type { EntityMeta } from "./base";
import type { FuenteSatelital } from "@/constants/enums";

/**
 * Índices espectrales derivados de imágenes satelitales (Landsat/Sentinel).
 * Preparado para integración con Google Earth Engine (Fase 4).
 */
export interface IndicesSatelitales extends EntityMeta {
  id: string;
  estacionId: string;
  fechaAdquisicion: string;
  fuente: FuenteSatelital;
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
  coberturaNubosa: number;
}
