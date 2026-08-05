/**
 * Mapeo Prisma ↔ Dominio HydroVision (Fase 5.0)
 */

import type {
  CampanaMonitoreo,
  ClasificacionECA,
  Cuenca,
  Departamento,
  Distrito,
  Estacion,
  IndicesSatelitales,
  Muestra,
  ParametrosFisicoquimicos,
  Provincia,
  Reporte,
  Rio,
  Usuario,
} from "@/models";
import type {
  EstadoCampana,
  EstadoECA,
  EstadoEstacion,
  EstadoReporte,
  FuenteSatelital,
  RolUsuario,
  TipoParametro,
} from "@/constants/enums";
import {
  EstadoCampana as EstadoCampanaEnum,
  EstadoECA as EstadoECAEnum,
  EstadoEstacion as EstadoEstacionEnum,
  EstadoReporte as EstadoReporteEnum,
  FuenteSatelital as FuenteSatelitalEnum,
  RolUsuario as RolUsuarioEnum,
} from "@/constants/enums";
import type {
  Campana as PrismaCampana,
  Cuenca as PrismaCuenca,
  Departamento as PrismaDepartamento,
  Distrito as PrismaDistrito,
  EvaluacionAmbiental,
  IndiceSatelital,
  Medicion,
  Muestreo,
  Parametro,
  Provincia as PrismaProvincia,
  PuntoMonitoreo as PrismaPuntoMonitoreo,
  Reporte as PrismaReporte,
  ReportePuntoMonitoreo,
  Rio as PrismaRio,
  Usuario as PrismaUsuario,
} from "@prisma/client";
import { PARAMETRO_CATALOG_BY_CODIGO } from "@/database/constants/parametros-catalog";

const META_SIMULATED = {
  isSimulated: false as const,
};

function toIso(date: Date): string {
  return date.toISOString();
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapEntityMeta(createdAt: Date, updatedAt: Date) {
  return {
    createdAt: toIso(createdAt),
    updatedAt: toIso(updatedAt),
    ...META_SIMULATED,
  };
}

export function mapDepartamento(row: PrismaDepartamento): Departamento {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

export function mapProvincia(row: PrismaProvincia): Provincia {
  return {
    id: row.id,
    departamentoId: row.departamentoId,
    nombre: row.nombre,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

export function mapDistrito(row: PrismaDistrito): Distrito {
  return {
    id: row.id,
    provinciaId: row.provinciaId,
    nombre: row.nombre,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

export function mapCuenca(row: PrismaCuenca): Cuenca {
  return {
    id: row.id,
    distritoId: row.distritoId,
    nombre: row.nombre,
    areaKm2: row.areaKm2,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

export function mapRio(row: PrismaRio): Rio {
  return {
    id: row.id,
    cuencaId: row.cuencaId,
    nombre: row.nombre,
    centro: {
      latitude: row.centroLat,
      longitude: row.centroLng,
      zoom: row.zoomMapa,
    },
    longitudKm: row.longitudKm,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_ESTADO_ESTACION: Record<string, EstadoEstacion> = {
  active: EstadoEstacionEnum.ACTIVA,
  maintenance: EstadoEstacionEnum.MANTENIMIENTO,
  offline: EstadoEstacionEnum.FUERA_LINEA,
};

/** Mapea PuntoMonitoreo (DB v2) → Estacion (dominio UI) */
export function mapEstacion(row: PrismaPuntoMonitoreo): Estacion {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    rioId: row.rioId ?? "",
    cuencaId: row.cuencaId,
    coordenadas: { latitude: row.latitude, longitude: row.longitude },
    altitud: row.altitud,
    tramo: row.tramo,
    descripcion: row.descripcion ?? "",
    fechaInstalacion: toDateOnly(row.fechaInstalacion),
    estadoOperativo: PRISMA_ESTADO_ESTACION[row.estado] ?? EstadoEstacionEnum.ACTIVA,
    ultimaActualizacion: toIso(row.ultimaActualizacion),
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_ESTADO_CAMPANA: Record<string, EstadoCampana> = {
  planned: EstadoCampanaEnum.PLANIFICADA,
  active: EstadoCampanaEnum.EN_CURSO,
  completed: EstadoCampanaEnum.FINALIZADA,
  cancelled: EstadoCampanaEnum.CANCELADA,
};

export function mapCampana(row: PrismaCampana): CampanaMonitoreo {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    rioId: row.rioId,
    cuencaId: row.cuencaId,
    fechaInicio: toDateOnly(row.fechaInicio),
    fechaFin: toDateOnly(row.fechaFin),
    responsableId: row.responsableId,
    estado: PRISMA_ESTADO_CAMPANA[row.estado] ?? EstadoCampanaEnum.PLANIFICADA,
    objetivo: row.objetivo,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

export function mapMuestreo(row: Muestreo): Muestra {
  return {
    id: row.id,
    campanaId: row.campanaId,
    estacionId: row.puntoMonitoreoId,
    codigoMuestra: row.codigoMuestra,
    fechaMuestreo: toIso(row.fechaMuestreo),
    responsableId: row.responsableId,
    clima: row.clima,
    colorAparente: row.colorAparente,
    observaciones: row.observaciones ?? undefined,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_FUENTE: Record<string, FuenteSatelital> = {
  landsat8: FuenteSatelitalEnum.LANDSAT_8,
  landsat9: FuenteSatelitalEnum.LANDSAT_9,
  sentinel2: FuenteSatelitalEnum.SENTINEL_2,
};

export function mapIndiceSatelital(row: IndiceSatelital): IndicesSatelitales {
  return {
    id: row.id,
    estacionId: row.puntoMonitoreoId,
    fechaAdquisicion: toDateOnly(row.fechaAdquisicion),
    fuente: PRISMA_FUENTE[row.fuente] ?? FuenteSatelitalEnum.SENTINEL_2,
    ndwi: row.ndwi,
    ndvi: row.ndvi,
    mndwi: row.mndwi,
    ndti: row.ndti,
    coberturaNubosa: row.coberturaNubosa,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_ROL: Record<string, RolUsuario> = {
  admin: RolUsuarioEnum.ADMINISTRADOR,
  researcher: RolUsuarioEnum.INVESTIGADOR,
  field_operator: RolUsuarioEnum.OPERADOR_CAMPO,
  viewer: RolUsuarioEnum.VISOR,
};

export function mapUsuario(row: PrismaUsuario): Usuario {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: PRISMA_ROL[row.rol] ?? RolUsuarioEnum.VISOR,
    institucion: row.institucion,
    activo: row.activo,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_ESTADO_REPORTE: Record<string, EstadoReporte> = {
  draft: EstadoReporteEnum.BORRADOR,
  generated: EstadoReporteEnum.GENERADO,
  published: EstadoReporteEnum.PUBLICADO,
  archived: EstadoReporteEnum.ARCHIVADO,
};

export function mapReporte(
  row: PrismaReporte,
  puntoLinks: ReportePuntoMonitoreo[]
): Reporte {
  return {
    id: row.id,
    titulo: row.titulo,
    rioId: row.rioId,
    cuencaId: row.cuencaId,
    estacionIds: puntoLinks
      .filter((link) => link.reporteId === row.id)
      .map((link) => link.puntoMonitoreoId),
    fechaInicio: toDateOnly(row.fechaInicio),
    fechaFin: toDateOnly(row.fechaFin),
    generadoPorId: row.generadoPorId,
    estado: PRISMA_ESTADO_REPORTE[row.estado] ?? EstadoReporteEnum.BORRADOR,
    resumen: row.resumen,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const PRISMA_ESTADO_ECA: Record<string, EstadoECA> = {
  compliant: EstadoECAEnum.CUMPLE,
  alert: EstadoECAEnum.EN_ALERTA,
  non_compliant: EstadoECAEnum.NO_CUMPLE,
};

export function mapEvaluacionAmbiental(row: EvaluacionAmbiental): ClasificacionECA {
  return {
    id: row.id,
    muestraId: row.muestreoId,
    estacionId: row.puntoMonitoreoId,
    estado: PRISMA_ESTADO_ECA[row.estado] ?? EstadoECAEnum.CUMPLE,
    parametrosViolados: row.parametrosViolados as TipoParametro[],
    parametrosEnAlerta: row.parametrosEnAlerta as TipoParametro[],
    evaluadoEn: toIso(row.evaluadoEn),
    normativaReferencia: row.normativaReferencia,
    ...mapEntityMeta(row.createdAt, row.updatedAt),
  };
}

const CODIGO_TO_DOMAIN: Record<
  string,
  keyof Omit<
    ParametrosFisicoquimicos,
    "id" | "muestraId" | "estacionId" | "createdAt" | "updatedAt" | "isSimulated"
  >
> = {
  ph: "ph",
  turbidity: "turbidez",
  conductivity: "conductividad",
  dissolved_oxygen: "oxigenoDisuelto",
  temperature: "temperatura",
  bod5: "dbo5",
  cod: "dqo",
  coliforms: "coliformes",
  nitrates: "nitratos",
  phosphates: "fosfatos",
  total_dissolved_solids: "solidosDisueltosTotales",
  flow_rate: "caudal",
};

/** Agrega mediciones normalizadas al shape plano esperado por la UI */
export function aggregateMedicionesToParametros(
  muestreos: Muestreo[],
  mediciones: Array<Medicion & { parametro: Parametro }>
): ParametrosFisicoquimicos[] {
  return muestreos.map((muestreo) => {
    const rows = mediciones.filter((m) => m.muestreoId === muestreo.id);
    const base: ParametrosFisicoquimicos = {
      id: `param-${muestreo.id}`,
      muestraId: muestreo.id,
      estacionId: muestreo.puntoMonitoreoId,
      ph: 0,
      turbidez: 0,
      conductividad: 0,
      oxigenoDisuelto: 0,
      temperatura: 0,
      dbo5: 0,
      dqo: 0,
      coliformes: undefined,
      nitratos: undefined,
      fosfatos: undefined,
      solidosDisueltosTotales: 0,
      caudal: 0,
      ...mapEntityMeta(muestreo.createdAt, muestreo.updatedAt),
    };

    for (const medicion of rows) {
      const field = CODIGO_TO_DOMAIN[medicion.parametro.codigo];
      if (!field) continue;
      base[field] = medicion.valor;
    }

    return base;
  });
}

export function getParametroCatalogEntry(codigo: Parametro["codigo"]) {
  return PARAMETRO_CATALOG_BY_CODIGO[codigo];
}
