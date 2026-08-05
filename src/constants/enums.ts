/**
 * Enumeraciones del dominio HydroVision.
 * Centralizadas para uso en modelos, mock data y futura capa PostgreSQL.
 */

/** Clasificación según Estándares de Calidad Ambiental (ECA) */
export enum EstadoECA {
  CUMPLE = "compliant",
  EN_ALERTA = "alert",
  NO_CUMPLE = "non_compliant",
}

/** Estado operativo de una estación de monitoreo */
export enum EstadoEstacion {
  ACTIVA = "active",
  MANTENIMIENTO = "maintenance",
  FUERA_LINEA = "offline",
}

/** Tipos de parámetros fisicoquímicos monitoreados */
export enum TipoParametro {
  PH = "ph",
  TURBIDEZ = "turbidity",
  CONDUCTIVIDAD = "conductivity",
  OXIGENO_DISUELTO = "dissolvedOxygen",
  TEMPERATURA = "temperature",
  DBO5 = "bod5",
  DQO = "cod",
  COLIFORMES = "coliforms",
  SOLIDOS_DISUELTOS = "totalDissolvedSolids",
  CAUDAL = "flowRate",
}

/** Roles de usuario del sistema */
export enum RolUsuario {
  ADMINISTRADOR = "admin",
  INVESTIGADOR = "researcher",
  OPERADOR_CAMPO = "field_operator",
  VISOR = "viewer",
}

/** Nivel de alerta ambiental */
export enum NivelAlerta {
  BAJO = "low",
  MEDIO = "medium",
  ALTO = "high",
  CRITICO = "critical",
}

/** Fuente de imagen satelital */
export enum FuenteSatelital {
  LANDSAT_8 = "landsat8",
  LANDSAT_9 = "landsat9",
  SENTINEL_2 = "sentinel2",
}

/** Estado de una campaña de monitoreo */
export enum EstadoCampana {
  PLANIFICADA = "planned",
  EN_CURSO = "active",
  FINALIZADA = "completed",
  CANCELADA = "cancelled",
}

/** Estado de generación de un reporte */
export enum EstadoReporte {
  BORRADOR = "draft",
  GENERADO = "generated",
  PUBLICADO = "published",
  ARCHIVADO = "archived",
}

/** Etiquetas legibles para enums (UI futura) */
export const ESTADO_ECA_LABELS: Record<EstadoECA, string> = {
  [EstadoECA.CUMPLE]: "Cumple ECA",
  [EstadoECA.EN_ALERTA]: "En alerta",
  [EstadoECA.NO_CUMPLE]: "No cumple",
};

export const ESTADO_ESTACION_LABELS: Record<EstadoEstacion, string> = {
  [EstadoEstacion.ACTIVA]: "Operativa",
  [EstadoEstacion.MANTENIMIENTO]: "En mantenimiento",
  [EstadoEstacion.FUERA_LINEA]: "Fuera de línea",
};

export const ROL_USUARIO_LABELS: Record<RolUsuario, string> = {
  [RolUsuario.ADMINISTRADOR]: "Administrador",
  [RolUsuario.INVESTIGADOR]: "Investigador",
  [RolUsuario.OPERADOR_CAMPO]: "Operador de campo",
  [RolUsuario.VISOR]: "Visor",
};

export const ESTADO_CAMPANA_LABELS: Record<EstadoCampana, string> = {
  [EstadoCampana.PLANIFICADA]: "Planificada",
  [EstadoCampana.EN_CURSO]: "En curso",
  [EstadoCampana.FINALIZADA]: "Finalizada",
  [EstadoCampana.CANCELADA]: "Cancelada",
};
