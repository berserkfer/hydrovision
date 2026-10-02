import {
  EstadoCampana,
  EstadoECA,
  EstadoEstacion,
  EstadoReporte,
  FuenteSatelital,
  RolUsuario,
  TipoParametro,
} from "@/constants/enums";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { classifyMeasurement } from "@/lib/eca/classifier";
import type { FieldMeasurement } from "@/types";
import type { HydroVisionDataStore } from "@/models";
import { buildDren4000MockData, DREN_4000_CUENCA_ID, DREN_4000_RIO_ID } from "./dren-4000-real-data";

const META = {
  createdAt: "2025-01-01T00:00:00-05:00",
  updatedAt: MOCK_LAST_UPDATE,
  isSimulated: true as const,
};

/** Perfiles de parámetros reutilizables por estación */
const PARAM_PROFILES = [
  { ph: 7.4, turbidez: 12, conductividad: 420, oxigenoDisuelto: 6.8, temperatura: 24.2, dbo5: 8, dqo: 22, coliformes: 180, tds: 273, caudal: 2.5 },
  { ph: 7.1, turbidez: 28, conductividad: 680, oxigenoDisuelto: 5.2, temperatura: 25.8, dbo5: 14, dqo: 38, coliformes: 520, tds: 442, caudal: 4.3 },
  { ph: 6.9, turbidez: 35, conductividad: 890, oxigenoDisuelto: 4.6, temperatura: 26.4, dbo5: 16, dqo: 42, coliformes: 780, tds: 578, caudal: 5.1 },
  { ph: 7.6, turbidez: 18, conductividad: 510, oxigenoDisuelto: 6.1, temperatura: 24.8, dbo5: 10, dqo: 28, coliformes: 240, tds: 331, caudal: 3.8 },
  { ph: 6.4, turbidez: 48, conductividad: 1120, oxigenoDisuelto: 3.8, temperatura: 27.1, dbo5: 22, dqo: 55, coliformes: 1200, tds: 728, caudal: 6.2 },
  { ph: 7.3, turbidez: 22, conductividad: 590, oxigenoDisuelto: 5.5, temperatura: 25.2, dbo5: 12, dqo: 34, coliformes: 410, tds: 383, caudal: 4.0 },
];

interface RiverSeed {
  rioId: string;
  cuencaId: string;
  nombre: string;
  centro: { latitude: number; longitude: number; zoom: number };
  longitudKm: number;
  segments: string[];
  baseLat: number;
  baseLng: number;
  latStep: number;
  lngStep: number;
  baseAltitude: number;
}

function buildRiverData(seed: RiverSeed) {
  const statuses = [
    EstadoEstacion.ACTIVA,
    EstadoEstacion.ACTIVA,
    EstadoEstacion.ACTIVA,
    EstadoEstacion.MANTENIMIENTO,
    EstadoEstacion.ACTIVA,
    EstadoEstacion.ACTIVA,
  ];

  const estaciones = seed.segments.map((segment, i) => {
    const codigo = `P${i + 1}`;
    const estacionId = `${seed.rioId}-${codigo.toLowerCase()}`;
    return {
      estacion: {
        id: estacionId,
        codigo,
        nombre: `Estación ${codigo} — ${segment}`,
        rioId: seed.rioId,
        cuencaId: seed.cuencaId,
        coordenadas: {
          latitude: Number((seed.baseLat + i * seed.latStep).toFixed(4)),
          longitude: Number((seed.baseLng + i * seed.lngStep).toFixed(4)),
        },
        altitud: seed.baseAltitude + i * 12 + (i % 2) * 8,
        tramo: segment,
        descripcion: `Punto de monitoreo simulado — ${segment}.`,
        fechaInstalacion: `202${2 + (i % 3)}-${String(3 + i).padStart(2, "0")}-15`,
        estadoOperativo: statuses[i % statuses.length],
        ultimaActualizacion: MOCK_LAST_UPDATE,
        ...META,
      },
      index: i,
    };
  });

  return { estaciones };
}

/** Almacén mock unificado — única fuente de verdad (Fase 3.0) */
function buildMockStore(): HydroVisionDataStore {
  const departamentos = [
    { id: "lambayeque", nombre: "Lambayeque", codigo: "LAM", ...META },
    { id: "la-libertad", nombre: "La Libertad", codigo: "LAL", ...META },
  ];

  const provincias = [
    { id: "lambayeque-prov", departamentoId: "lambayeque", nombre: "Lambayeque", ...META },
    { id: "ferrenafe", departamentoId: "lambayeque", nombre: "Ferreñafe", ...META },
    { id: "chiclayo", departamentoId: "lambayeque", nombre: "Chiclayo", ...META },
    { id: "trujillo", departamentoId: "la-libertad", nombre: "Trujillo", ...META },
  ];

  const distritos = [
    { id: "reque", provinciaId: "lambayeque-prov", nombre: "Reque", ...META },
    { id: "monsefu", provinciaId: "lambayeque-prov", nombre: "Monsefú", ...META },
    { id: "ferrenafe-dist", provinciaId: "ferrenafe", nombre: "Ferreñafe", ...META },
    // Santa Rosa — confirmado por la cita fuente de los datos reales del Dren 4000
    { id: "santa-rosa", provinciaId: "chiclayo", nombre: "Santa Rosa", ...META },
    { id: "laredo", provinciaId: "trujillo", nombre: "Laredo", ...META },
  ];

  const cuencas = [
    { id: "cuenca-reque", distritoId: "reque", nombre: "Cuenca Reque", areaKm2: 1250, ...META },
    { id: "cuenca-zana", distritoId: "monsefu", nombre: "Cuenca Zaña", areaKm2: 980, ...META },
    { id: "cuenca-la-leche", distritoId: "ferrenafe-dist", nombre: "Cuenca La Leche", areaKm2: 2100, ...META },
    // Dren 4000 es un canal de drenaje artificial, no una cuenca hidrográfica — areaKm2 no aplica
    // (0 = sin dato, no un valor real). Ver dren-4000-real-data.ts para las mediciones reales.
    { id: DREN_4000_CUENCA_ID, distritoId: "santa-rosa", nombre: "Santa Rosa", areaKm2: 0, ...META },
    { id: "cuenca-moche", distritoId: "laredo", nombre: "Cuenca Moche", areaKm2: 3400, ...META },
  ];

  const rios = [
    {
      id: "rio-reque",
      cuencaId: "cuenca-reque",
      nombre: "Río Reque",
      centro: { latitude: -6.7017, longitude: -79.9068, zoom: 12 },
      longitudKm: 45,
      ...META,
    },
    {
      id: "rio-zana",
      cuencaId: "cuenca-zana",
      nombre: "Río Zaña",
      centro: { latitude: -6.7521, longitude: -79.8124, zoom: 12 },
      longitudKm: 38,
      ...META,
    },
    {
      id: "rio-la-leche",
      cuencaId: "cuenca-la-leche",
      nombre: "Río La Leche",
      centro: { latitude: -6.6142, longitude: -79.9284, zoom: 12 },
      longitudKm: 120,
      ...META,
    },
    {
      id: "rio-moche",
      cuencaId: "cuenca-moche",
      nombre: "Río Moche",
      centro: { latitude: -8.0456, longitude: -79.0124, zoom: 11 },
      longitudKm: 150,
      ...META,
    },
    {
      // Centro/zoom son aproximados para el mapa — las coordenadas de CADA estación (abajo)
      // sí son las reales georreferenciadas por la fuente citada, no aproximadas.
      // longitudKm=14.143 según fuente pública (canal de drenaje agrícola, Lambayeque,
      // desemboca en Santa Rosa) — no medido directamente por HydroVision.
      id: DREN_4000_RIO_ID,
      cuencaId: DREN_4000_CUENCA_ID,
      nombre: "Dren 4000",
      centro: { latitude: -6.875, longitude: -79.929, zoom: 15 },
      longitudKm: 14.143,
      ...META,
    },
  ];

  const riverSeeds: RiverSeed[] = [
    {
      rioId: "rio-reque",
      cuencaId: "cuenca-reque",
      nombre: "Río Reque",
      centro: rios[0].centro,
      longitudKm: 45,
      segments: ["Sector alto", "Tramo urbano", "Uso agrícola", "Confluencia", "Influencia industrial", "Sector bajo"],
      baseLat: -6.6284,
      baseLng: -79.8621,
      latStep: -0.018,
      lngStep: -0.011,
      baseAltitude: 38,
    },
    {
      rioId: "rio-zana",
      cuencaId: "cuenca-zana",
      nombre: "Río Zaña",
      centro: rios[1].centro,
      longitudKm: 38,
      segments: ["Naciente", "Canal agrícola", "Puente principal", "Desembocadura"],
      baseLat: -6.7385,
      baseLng: -79.7852,
      latStep: -0.015,
      lngStep: -0.009,
      baseAltitude: 52,
    },
    {
      rioId: "rio-la-leche",
      cuencaId: "cuenca-la-leche",
      nombre: "Río La Leche",
      centro: rios[2].centro,
      longitudKm: 120,
      segments: ["Embalse", "Tramo medio", "Zona riego", "Sector urbano", "Delta costero"],
      baseLat: -6.5821,
      baseLng: -79.9456,
      latStep: -0.012,
      lngStep: -0.008,
      baseAltitude: 65,
    },
    {
      rioId: "rio-moche",
      cuencaId: "cuenca-moche",
      nombre: "Río Moche",
      centro: rios[3].centro,
      longitudKm: 150,
      segments: ["Sierra", "Valle medio", "Estuario"],
      baseLat: -8.0123,
      baseLng: -78.9856,
      latStep: -0.02,
      lngStep: -0.014,
      baseAltitude: 120,
    },
  ];

  const dren4000 = buildDren4000MockData();

  const estaciones = [
    ...riverSeeds.flatMap((seed) => buildRiverData(seed).estaciones.map((e) => e.estacion)),
    ...dren4000.estaciones,
  ];

  const usuarios = [
    {
      id: "usr-admin",
      nombre: "Dr. Ana Torres",
      email: "a.torres@universidad.edu.pe",
      rol: RolUsuario.ADMINISTRADOR,
      institucion: "Universidad Nacional — Tesis Ing. Ambiental",
      activo: true,
      ...META,
    },
    {
      id: "usr-investigador",
      nombre: "Carlos Mendoza",
      email: "c.mendoza@ambiental.gob.pe",
      rol: RolUsuario.INVESTIGADOR,
      institucion: "Autoridad Ambiental Regional",
      activo: true,
      ...META,
    },
    {
      id: "usr-operador",
      nombre: "María Reque",
      email: "m.reque@campo.pe",
      rol: RolUsuario.OPERADOR_CAMPO,
      institucion: "Equipo de monitoreo Reque",
      activo: true,
      ...META,
    },
    {
      id: "usr-visor",
      nombre: "Luis Consulta",
      email: "l.consulta@hydrovision.local",
      rol: RolUsuario.VISOR,
      institucion: "Observador externo — cuenta ficticia",
      activo: true,
      ...META,
    },
    {
      id: "usr-inactivo",
      nombre: "Usuario Inactivo",
      email: "inactivo@hydrovision.local",
      rol: RolUsuario.INVESTIGADOR,
      institucion: "Cuenta deshabilitada — prueba Sprint 3I",
      activo: false,
      ...META,
    },
  ];

  const campanas = [
    {
      id: "camp-2025-01",
      codigo: "CAMP-2025-01",
      nombre: "Campaña Seca 2025 — Reque",
      rioId: "rio-reque",
      cuencaId: "cuenca-reque",
      fechaInicio: "2025-05-01",
      fechaFin: "2025-06-30",
      responsableId: "usr-investigador",
      estado: EstadoCampana.EN_CURSO,
      objetivo: "Evaluación de calidad del agua en estaciones P1–P6.",
      ...META,
    },
    {
      id: "camp-2025-02",
      codigo: "CAMP-2025-02",
      nombre: "Campaña Lluvias 2025 — Zaña",
      rioId: "rio-zana",
      cuencaId: "cuenca-zana",
      fechaInicio: "2025-01-15",
      fechaFin: "2025-03-31",
      responsableId: "usr-investigador",
      estado: EstadoCampana.FINALIZADA,
      objetivo: "Monitoreo post-lluvias en cuenca Zaña.",
      ...META,
    },
    {
      id: "camp-2025-03",
      codigo: "CAMP-2025-03",
      nombre: "Campaña La Leche — Q1 2025",
      rioId: "rio-la-leche",
      cuencaId: "cuenca-la-leche",
      fechaInicio: "2025-02-01",
      fechaFin: "2025-04-30",
      responsableId: "usr-operador",
      estado: EstadoCampana.FINALIZADA,
      objetivo: "Caracterización fisicoquímica del río La Leche.",
      ...META,
    },
    {
      id: "camp-2025-04",
      codigo: "CAMP-2025-04",
      nombre: "Campaña Moche — Piloto",
      rioId: "rio-moche",
      cuencaId: "cuenca-moche",
      fechaInicio: "2025-07-01",
      fechaFin: "2025-08-31",
      responsableId: "usr-admin",
      estado: EstadoCampana.PLANIFICADA,
      objetivo: "Piloto de monitoreo en cuenca Moche.",
      ...META,
    },
    {
      id: "camp-2025-05",
      codigo: "CAMP-2025-05",
      nombre: "Campaña Reque — Seguimiento",
      rioId: "rio-reque",
      cuencaId: "cuenca-reque",
      fechaInicio: "2025-07-15",
      fechaFin: "2025-09-15",
      responsableId: "usr-operador",
      estado: EstadoCampana.PLANIFICADA,
      objetivo: "Seguimiento trimestral de estaciones P1–P6.",
      ...META,
    },
    ...dren4000.campanas,
  ];

  const muestras: HydroVisionDataStore["muestras"] = [...dren4000.muestras];
  const parametros: HydroVisionDataStore["parametros"] = [...dren4000.parametros];
  const clasificaciones: HydroVisionDataStore["clasificaciones"] = [];
  const indicesSatelitales: HydroVisionDataStore["indicesSatelitales"] = [];

  // Dren 4000 tiene sus propias muestras/parámetros REALES (arriba) — nunca se le genera
  // un muestreo sintético de 2025 encima, para no mezclar dato real con dato fabricado.
  estaciones.forEach((estacion, globalIndex) => {
    if (estacion.rioId === DREN_4000_RIO_ID) return;

    const profile = PARAM_PROFILES[globalIndex % PARAM_PROFILES.length];
    const muestraId = `muestra-${estacion.id}-001`;
    const campanaId = estacion.rioId === "rio-reque" ? "camp-2025-01" : `camp-${estacion.rioId}`;

    muestras.push({
      id: muestraId,
      campanaId,
      estacionId: estacion.id,
      codigoMuestra: `${estacion.codigo}-2025-06`,
      fechaMuestreo: MOCK_LAST_UPDATE,
      responsableId: "usr-operador",
      clima: "soleado",
      colorAparente: "verde_claro",
      observaciones: "Muestreo simulado de rutina.",
      ...META,
    });

    parametros.push({
      id: `param-${muestraId}`,
      muestraId,
      estacionId: estacion.id,
      ph: profile.ph,
      turbidez: profile.turbidez,
      conductividad: profile.conductividad,
      oxigenoDisuelto: profile.oxigenoDisuelto,
      temperatura: profile.temperatura,
      dbo5: profile.dbo5,
      dqo: profile.dqo,
      coliformes: profile.coliformes,
      solidosDisueltosTotales: profile.tds,
      caudal: profile.caudal,
      ...META,
    });
  });

  // Clasificaciones ECA derivadas del clasificador (consistencia con UI).
  // Dren 4000 tiene 2 muestras REALES por estación (marzo y setiembre 2014) en vez de 1
  // sintética — se clasifica cada una por separado, abajo, y nunca se le fabrica un
  // índice satelital (Sentinel-2 no existía en 2014; ver dren-4000-real-data.ts).
  estaciones.forEach((estacion, globalIndex) => {
    if (estacion.rioId === DREN_4000_RIO_ID) return;

    const params = parametros.find((p) => p.estacionId === estacion.id)!;
    const muestra = muestras.find((m) => m.estacionId === estacion.id)!;
    const measurement: FieldMeasurement = {
      id: params.id,
      stationId: estacion.codigo,
      sampledAt: muestra.fechaMuestreo,
      ph: params.ph,
      turbidity: params.turbidez,
      conductivity: params.conductividad,
      dissolvedOxygen: params.oxigenoDisuelto,
      temperature: params.temperatura,
      bod5: params.dbo5,
      cod: params.dqo,
      coliforms: params.coliformes,
      isSimulated: true,
    };
    const result = classifyMeasurement(measurement);

    clasificaciones.push({
      id: `eca-${muestra.id}`,
      muestraId: muestra.id,
      estacionId: estacion.id,
      estado: result.status as EstadoECA,
      parametrosViolados: result.violatedParameters as TipoParametro[],
      parametrosEnAlerta: result.alertParameters as TipoParametro[],
      evaluadoEn: MOCK_LAST_UPDATE,
      normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa)",
      ...META,
    });

    indicesSatelitales.push({
      id: `sat-${estacion.id}`,
      estacionId: estacion.id,
      fechaAdquisicion: "2025-06-10",
      fuente: globalIndex % 2 === 0 ? FuenteSatelital.SENTINEL_2 : FuenteSatelital.LANDSAT_9,
      ndwi: Number((0.08 + (globalIndex % 6) * 0.03).toFixed(3)),
      ndvi: Number((0.32 + (globalIndex % 6) * 0.04).toFixed(3)),
      mndwi: Number((0.12 + (globalIndex % 6) * 0.025).toFixed(3)),
      ndti: Number((-0.05 + (globalIndex % 6) * 0.02).toFixed(3)),
      coberturaNubosa: Number((5 + (globalIndex % 6) * 3).toFixed(1)),
      ...META,
    });
  });

  // Clasificación ECA real para las 20 muestras del Dren 4000 (2 fechas × 10 puntos) —
  // mismo clasificador, datos reales. Sin índice satelital: Sentinel-2 no existía en 2014.
  dren4000.muestras.forEach((muestra) => {
    const params = dren4000.parametros.find((p) => p.muestraId === muestra.id);
    if (!params) return;

    const measurement: FieldMeasurement = {
      id: params.id,
      stationId: estaciones.find((e) => e.id === muestra.estacionId)?.codigo ?? muestra.estacionId,
      sampledAt: muestra.fechaMuestreo,
      ph: params.ph,
      turbidity: params.turbidez,
      conductivity: params.conductividad,
      dissolvedOxygen: params.oxigenoDisuelto,
      temperature: params.temperatura,
      bod5: params.dbo5,
      cod: params.dqo,
      coliforms: params.coliformes,
      isSimulated: false,
    };
    const result = classifyMeasurement(measurement);

    clasificaciones.push({
      id: `eca-${muestra.id}`,
      muestraId: muestra.id,
      estacionId: muestra.estacionId,
      estado: result.status as EstadoECA,
      parametrosViolados: result.violatedParameters as TipoParametro[],
      parametrosEnAlerta: result.alertParameters as TipoParametro[],
      evaluadoEn: MOCK_LAST_UPDATE,
      normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa)",
      createdAt: muestra.createdAt,
      updatedAt: muestra.updatedAt,
      isSimulated: false,
    });
  });

  const reportes = [
    {
      id: "rep-2025-06-reque",
      titulo: "Informe mensual — Río Reque Junio 2025",
      rioId: "rio-reque",
      cuencaId: "cuenca-reque",
      estacionIds: estaciones.filter((e) => e.rioId === "rio-reque").map((e) => e.id),
      fechaInicio: "2025-06-01",
      fechaFin: "2025-06-30",
      generadoPorId: "usr-investigador",
      estado: EstadoReporte.BORRADOR,
      resumen: "Reporte simulado para tesis — pendiente módulo PDF.",
      ...META,
    },
  ];

  return {
    departamentos,
    provincias,
    distritos,
    cuencas,
    rios,
    estaciones,
    campanas,
    muestras,
    parametros,
    clasificaciones,
    indicesSatelitales,
    usuarios,
    reportes,
  };
}

/** Instancia singleton del almacén mock */
export const mockDataStore: HydroVisionDataStore = buildMockStore();

export { PARAM_PROFILES };
