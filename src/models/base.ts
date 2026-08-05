/**
 * Metadatos base compartidos por entidades del dominio.
 * Facilita trazabilidad entre datos simulados y futura persistencia.
 */
export interface EntityMeta {
  createdAt: string;
  updatedAt: string;
  /** true = mock/local; false = persistido en base de datos */
  isSimulated: boolean;
}

/** Coordenadas geográficas WGS84 */
export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/** Centro cartográfico con nivel de zoom */
export interface CentroMapa extends Coordenadas {
  zoom: number;
}
