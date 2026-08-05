/**
 * Contrato de imágenes satelitales GEE — Sprint 1 (sin consumo real)
 */

import type { GeeImageQuery, GeeImageSummary } from "../types/gee.types";

export interface GEEImageService {
  /** Catálogo de colecciones soportadas por HydroVision */
  listSupportedCollections(): Array<GeeImageQuery["collection"]>;

  /** Búsqueda simulada — no consulta catálogos GEE reales en Sprint 1 */
  searchImages(query: GeeImageQuery): Promise<GeeImageSummary[]>;

  /** Metadatos simulados de una imagen por identificador */
  getImageMetadata(imageId: string): Promise<GeeImageSummary | null>;
}
