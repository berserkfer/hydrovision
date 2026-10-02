/**
 * Dren 4000 (Lambayeque) — mediciones de campo/laboratorio REALES publicadas.
 *
 * Fuente: Nizama Pacheco, L. K. & Cabrera Carranza, C. F. (2018). "Impacto del Dren 4000
 * al Ecosistema Marino de la Caleta Santa Rosa, Lambayeque y Alternativas de Recuperación."
 * Tabla 2 — muestras tomadas en los 10 puntos de monitoreo del Dren 4000.
 * https://revistasinvestigacion.unmsm.edu.pe/index.php/iigeo/article/download/14992/13054
 *
 * IMPORTANTE — trazabilidad de campo isSimulated:
 * En el resto de src/data/mock/store.ts, isSimulated=true significa "dato sintético de
 * demostración". Aquí NO: estas 20 muestras (10 puntos × 2 fechas: 2014-03-01 y 2014-09-01)
 * son datos reales publicados, marcados isSimulated=false explícitamente, aunque vivan en el
 * almacén mock (no hay Postgres real conectado en este entorno). Ver field-measurement.loader.ts,
 * que respeta este flag por registro en vez de asumirlo desde DATA_SOURCE.
 *
 * IMPORTANTE — sin Sentinel-2 para 2014:
 * Sentinel-2A fue lanzado en junio de 2015. Estas muestras NO deben ni pueden emparejarse con
 * observaciones satelitales — por eso esta estación NO tiene entradas en `indicesSatelitales`
 * (a diferencia de las demás estaciones del store, que sí llevan una entrada sintética).
 * El emparejamiento campo↔satélite real para Dren 4000 solo aplicará a muestreos posteriores
 * a junio de 2015, vía consulta Copernicus/GEE en vivo (nunca datos satelitales fabricados).
 *
 * Conversión de unidades: el CSV fuente reporta conductividad en mS/cm; PARAMETRO_CATALOG usa
 * µS/cm (igual que el resto de HydroVision) — se multiplica ×1000 aquí, una sola vez.
 */

import type { Coordenadas, EntityMeta } from "@/models/base";
import type { Estacion } from "@/models/station";
import type { CampanaMonitoreo, Muestra, ParametrosFisicoquimicos } from "@/models/monitoring";
import { EstadoCampana, EstadoEstacion } from "@/constants/enums";

export const DREN_4000_RIO_ID = "dren-4000";
export const DREN_4000_CUENCA_ID = "cuenca-dren-4000";

export const DREN_4000_SOURCE_CITATION =
  "Nizama Pacheco, L. K. & Cabrera Carranza, C. F. (2018). Impacto del Dren 4000 al Ecosistema Marino de la Caleta Santa Rosa, Lambayeque y Alternativas de Recuperación (Tabla 2).";
export const DREN_4000_SOURCE_URL =
  "https://revistasinvestigacion.unmsm.edu.pe/index.php/iigeo/article/download/14992/13054";

const REAL_META: EntityMeta = {
  createdAt: "2018-01-01T00:00:00-05:00",
  updatedAt: "2018-01-01T00:00:00-05:00",
  isSimulated: false,
};

interface Dren4000PointSeed {
  codigo: string;
  nombre: string;
  descripcion: string;
  coordenadas: Coordenadas;
}

/** Los 10 puntos de monitoreo reales — coordenadas provistas por el usuario, WGS84 */
export const DREN_4000_POINTS: Dren4000PointSeed[] = [
  { codigo: "P1", nombre: "Unión con efluente de laguna de oxidación", descripcion: "Dren 4000, unión con efluente de laguna de oxidación", coordenadas: { latitude: -6.8721281932, longitude: -79.9227981642 } },
  { codigo: "P2", nombre: "Efluente de laguna de oxidación", descripcion: "Efluente de laguna de oxidación", coordenadas: { latitude: -6.8726814479, longitude: -79.9234847028 } },
  { codigo: "P3", nombre: "Efluente Terminal Pesquero ECOMPHISA", descripcion: "Efluente del Terminal Pesquero ECOMPHISA", coordenadas: { latitude: -6.8739979666, longitude: -79.9257441957 } },
  { codigo: "P4", nombre: "Efluente CEPPAR", descripcion: "Efluente de CEPPAR", coordenadas: { latitude: -6.8759197636, longitude: -79.92769465 } },
  { codigo: "P5", nombre: "Frente a procesamiento artesanal de pescado", descripcion: "Dren 4000 frente al procesamiento artesanal de pescado", coordenadas: { latitude: -6.8764093577, longitude: -79.9282274949 } },
  { codigo: "P6", nombre: "Orilla del mar — unión con efluentes del Dren 4000", descripcion: "Orilla del mar: unión del mar con efluentes del Dren 4000", coordenadas: { latitude: -6.8737503294, longitude: -79.9322968282 } },
  { codigo: "P7", nombre: "100 m NO de la desembocadura", descripcion: "100 m al noroeste de la desembocadura del Dren 4000", coordenadas: { latitude: -6.8772608901, longitude: -79.9288319292 } },
  { codigo: "P8", nombre: "Agua usada en procesamiento de pescado", descripcion: "Agua usada para procesamiento de pescado", coordenadas: { latitude: -6.8779187216, longitude: -79.9277535166 } },
  { codigo: "P9", nombre: "100 m SE de la desembocadura", descripcion: "100 m al sureste de la desembocadura del Dren 4000", coordenadas: { latitude: -6.8796799685, longitude: -79.9266726237 } },
  { codigo: "P10", nombre: "Proximidad a embarcaciones y restaurantes", descripcion: "Proximidad a embarcaciones y restaurantes", coordenadas: { latitude: -6.8823073805, longitude: -79.9246576266 } },
];

/** Valores medidos por punto y fecha — transcritos exactamente del CSV/XLSX fuente */
interface Dren4000SampleSeed {
  codigo: string;
  fecha: string;
  values: Omit<ParametrosFisicoquimicos, keyof EntityMeta | "id" | "muestraId" | "estacionId">;
}

const DREN_4000_SAMPLES: Dren4000SampleSeed[] = [
  { codigo: "P1", fecha: "2014-03-01", values: { coliformes: 240000, coliformesTermotolerantes: 17000, temperatura: 21, ph: 7.8, conductividad: 4200, solidosSuspendidosTotales: 10, dbo5: 43.2 } },
  { codigo: "P1", fecha: "2014-09-01", values: { coliformes: 200000, coliformesTermotolerantes: 16000, temperatura: 20.5, ph: 8.4, conductividad: 5300, solidosSuspendidosTotales: 14.8, dbo5: 69.4 } },
  { codigo: "P2", fecha: "2014-03-01", values: { coliformes: 82000000, coliformesTermotolerantes: 58000000, temperatura: 22.8, ph: 7.9, conductividad: 8600, solidosSuspendidosTotales: 5.8, dbo5: 171.6 } },
  { codigo: "P2", fecha: "2014-09-01", values: { coliformes: 7300000, coliformesTermotolerantes: 2400000, temperatura: 22, ph: 8.5, conductividad: 8500, solidosSuspendidosTotales: 1.5, dbo5: 145.8 } },
  { codigo: "P3", fecha: "2014-03-01", values: { coliformes: 9800000000, coliformesTermotolerantes: 3500000000, temperatura: 23.3, ph: 7.8, conductividad: 12600, solidosSuspendidosTotales: 27.5, dbo5: 816 } },
  { codigo: "P3", fecha: "2014-09-01", values: { coliformes: 58000000, coliformesTermotolerantes: 39000000, temperatura: 20.5, ph: 8.1, conductividad: 11200, solidosSuspendidosTotales: 47.7, dbo5: 613.2 } },
  { codigo: "P4", fecha: "2014-03-01", values: { coliformes: 300000, coliformesTermotolerantes: 130000, temperatura: 21.8, ph: 7.4, conductividad: 87800, solidosSuspendidosTotales: 15, dbo5: 556.8 } },
  { codigo: "P4", fecha: "2014-09-01", values: { coliformes: 2400000, coliformesTermotolerantes: 810000, temperatura: 22, ph: 7.2, conductividad: 98100, solidosSuspendidosTotales: 25, dbo5: 568.9 } },
  { codigo: "P5", fecha: "2014-03-01", values: { coliformes: 190000000, coliformesTermotolerantes: 180000000, temperatura: 21, ph: 7.8, conductividad: 6300, solidosSuspendidosTotales: 6, dbo5: 102 } },
  { codigo: "P5", fecha: "2014-09-01", values: { coliformes: 6300000, coliformesTermotolerantes: 540000, temperatura: 20, ph: 8.3, conductividad: 6500, solidosSuspendidosTotales: 13.3, dbo5: 201.8 } },
  { codigo: "P6", fecha: "2014-03-01", values: { coliformes: 32000000, coliformesTermotolerantes: 18000000, temperatura: 19.7, ph: 7.8, conductividad: 50900, solidosSuspendidosTotales: 15, dbo5: 62.4, nitratos: 30.8, fosfatos: 17.4 } },
  { codigo: "P6", fecha: "2014-09-01", values: { coliformes: 1400000, coliformesTermotolerantes: 360000, temperatura: 19, ph: 8.3, conductividad: 8000, solidosSuspendidosTotales: 8.4, dbo5: 104.2, nitratos: 48.2, fosfatos: 7.7 } },
  { codigo: "P7", fecha: "2014-03-01", values: { coliformes: 150000, coliformesTermotolerantes: 56000, temperatura: 19.5, ph: 7.7, conductividad: 53100, solidosSuspendidosTotales: 15.6, dbo5: 7.2, nitratos: 8.5, fosfatos: 0.5 } },
  { codigo: "P7", fecha: "2014-09-01", values: { coliformes: 190000, coliformesTermotolerantes: 160000, temperatura: 18, ph: 8.4, conductividad: 46900, solidosSuspendidosTotales: 5.6, dbo5: 10.3, nitratos: 11.4, fosfatos: 0.4 } },
  { codigo: "P8", fecha: "2014-03-01", values: { coliformes: 1300, coliformesTermotolerantes: 710, temperatura: 19, ph: 7.7, conductividad: 53200, solidosSuspendidosTotales: 18, dbo5: 1.8, nitratos: 5.3, fosfatos: 0.4 } },
  { codigo: "P8", fecha: "2014-09-01", values: { coliformes: 27000, coliformesTermotolerantes: 160000, temperatura: 18, ph: 8.3, conductividad: 52700, solidosSuspendidosTotales: 3.3, dbo5: 13.1, nitratos: 12.1, fosfatos: 0.1 } },
  { codigo: "P9", fecha: "2014-03-01", values: { coliformes: 260, coliformesTermotolerantes: 130, temperatura: 19.6, ph: 7.8, conductividad: 53100, solidosSuspendidosTotales: 8.4, dbo5: 1.5, nitratos: 3.7, fosfatos: 0.2 } },
  { codigo: "P9", fecha: "2014-09-01", values: { coliformes: 220, coliformesTermotolerantes: 150, temperatura: 17, ph: 8.5, conductividad: 54200, solidosSuspendidosTotales: 1.3, dbo5: 1.9, nitratos: 3.8, fosfatos: 0.1 } },
  { codigo: "P10", fecha: "2014-03-01", values: { coliformes: 1900, coliformesTermotolerantes: 170, temperatura: 19.6, ph: 7.8, conductividad: 53500, solidosSuspendidosTotales: 0, dbo5: 1.2, nitratos: 3.7, fosfatos: 0.5 } },
  { codigo: "P10", fecha: "2014-09-01", values: { coliformes: 360, coliformesTermotolerantes: 290, temperatura: 17, ph: 8.5, conductividad: 54700, solidosSuspendidosTotales: 0, dbo5: 2.6, nitratos: 5.6, fosfatos: 0.7 } },
];

/**
 * Sufijo "— histórico, sin Sentinel-2" agregado a propósito (Sentinel-2A se lanzó en junio
 * 2015): hace explícito en cualquier lista/selector de campañas de la app que estas dos
 * campañas NUNCA pueden emparejarse con satélite, sin depender de que quien lo lea sepa la
 * fecha de lanzamiento de memoria.
 */
const CAMPAIGN_BY_DATE: Record<string, { id: string; nombre: string; fechaFin: string }> = {
  "2014-03-01": {
    id: "camp-dren4000-2014-03",
    nombre: "Campaña Dren 4000 — Marzo 2014 (Nizama & Cabrera, 2018) — histórico, sin Sentinel-2",
    fechaFin: "2014-03-01",
  },
  "2014-09-01": {
    id: "camp-dren4000-2014-09",
    nombre: "Campaña Dren 4000 — Setiembre 2014 (Nizama & Cabrera, 2018) — histórico, sin Sentinel-2",
    fechaFin: "2014-09-01",
  },
};

export interface Dren4000MockData {
  estaciones: Estacion[];
  campanas: CampanaMonitoreo[];
  muestras: Muestra[];
  parametros: ParametrosFisicoquimicos[];
}

export function buildDren4000MockData(): Dren4000MockData {
  const estaciones: Estacion[] = DREN_4000_POINTS.map((point, index) => ({
    id: `${DREN_4000_RIO_ID}-${point.codigo.toLowerCase()}`,
    codigo: point.codigo,
    nombre: `${point.codigo} — ${point.nombre}`,
    rioId: DREN_4000_RIO_ID,
    cuencaId: DREN_4000_CUENCA_ID,
    coordenadas: point.coordenadas,
    altitud: 5 + index, // litoral — sin dato de altimetría en la fuente
    tramo: point.nombre,
    descripcion: `${point.descripcion} — punto real georreferenciado, fuente: ${DREN_4000_SOURCE_CITATION}`,
    fechaInstalacion: "2014-03-01",
    estadoOperativo: EstadoEstacion.ACTIVA,
    ultimaActualizacion: "2018-01-01",
    ...REAL_META,
  }));

  const campanas: CampanaMonitoreo[] = Object.entries(CAMPAIGN_BY_DATE).map(([fecha, info]) => ({
    id: info.id,
    codigo: info.id.toUpperCase(),
    nombre: info.nombre,
    rioId: DREN_4000_RIO_ID,
    cuencaId: DREN_4000_CUENCA_ID,
    fechaInicio: fecha,
    fechaFin: info.fechaFin,
    responsableId: "usr-investigador",
    estado: EstadoCampana.FINALIZADA,
    objetivo: `Caracterización fisicoquímica y microbiológica de los 10 puntos del Dren 4000 — dato real publicado, no recolectado por HydroVision. ${DREN_4000_SOURCE_URL}`,
    ...REAL_META,
  }));

  const muestras: Muestra[] = [];
  const parametros: ParametrosFisicoquimicos[] = [];

  DREN_4000_SAMPLES.forEach((sample, index) => {
    const estacionId = `${DREN_4000_RIO_ID}-${sample.codigo.toLowerCase()}`;
    const campana = CAMPAIGN_BY_DATE[sample.fecha];
    const muestraId = `muestra-dren4000-${sample.codigo.toLowerCase()}-${sample.fecha}`;

    muestras.push({
      id: muestraId,
      campanaId: campana.id,
      estacionId,
      codigoMuestra: `${sample.codigo}-${sample.fecha}`,
      fechaMuestreo: `${sample.fecha}T00:00:00-05:00`,
      responsableId: "usr-investigador",
      clima: "no reportado en la fuente",
      colorAparente: "no reportado en la fuente",
      observaciones: `Dato real publicado — ${DREN_4000_SOURCE_CITATION}`,
      ...REAL_META,
    });

    parametros.push({
      id: `param-dren4000-${sample.codigo.toLowerCase()}-${sample.fecha}-${index}`,
      muestraId,
      estacionId,
      ...sample.values,
      ...REAL_META,
    });
  });

  return { estaciones, campanas, muestras, parametros };
}
