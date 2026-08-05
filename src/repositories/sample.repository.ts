/**
 * Repositorio mock — Muestreos ambientales.
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { EstadoECA, TipoParametro } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import {
  classifyParametros,
  generateCodigoMuestra,
} from "@/lib/sampling/sampling-utils";
import type { ClasificacionECA } from "@/models/compliance";
import type { Muestra, ParametrosFisicoquimicos } from "@/models/monitoring";
import type {
  CreateMuestraPayload,
  MuestraDetail,
  MuestraSummary,
  SampleOperationResult,
  SampleStats,
} from "@/types/sampling";
import { estadoECAToCompliance } from "@/types/sampling";
import type { ComplianceStatus } from "@/types";
import { resolveNombre } from "@/utils";

function getEstadoECA(muestraId: string): ComplianceStatus {
  const clasificacion = getDataStore().clasificaciones.find((c) => c.muestraId === muestraId);
  if (!clasificacion) return "compliant";
  return estadoECAToCompliance(clasificacion.estado);
}

function toSummary(muestra: Muestra): MuestraSummary {
  const campana = getDataStore().campanas.find((c) => c.id === muestra.campanaId);
  const estacion = getDataStore().estaciones.find((e) => e.id === muestra.estacionId);

  return {
    id: muestra.id,
    codigoMuestra: muestra.codigoMuestra,
    fechaMuestreo: muestra.fechaMuestreo,
    campanaId: muestra.campanaId,
    campanaNombre: campana?.nombre ?? "—",
    campanaCodigo: campana?.codigo ?? "—",
    estacionId: muestra.estacionId,
    estacionCodigo: estacion?.codigo ?? "—",
    estacionNombre: estacion?.nombre ?? "—",
    responsableId: muestra.responsableId,
    responsableNombre: resolveNombre(muestra.responsableId, getDataStore().usuarios),
    estadoECA: getEstadoECA(muestra.id),
    clima: muestra.clima,
    colorAparente: muestra.colorAparente,
  };
}

function mapViolatedToLabels(params: TipoParametro[]): string[] {
  const labels: Record<string, string> = {
    [TipoParametro.PH]: "pH",
    [TipoParametro.TURBIDEZ]: "Turbidez",
    [TipoParametro.CONDUCTIVIDAD]: "Conductividad",
    [TipoParametro.OXIGENO_DISUELTO]: "Oxígeno disuelto",
    [TipoParametro.TEMPERATURA]: "Temperatura",
    [TipoParametro.DBO5]: "DBO5",
    [TipoParametro.DQO]: "DQO",
    [TipoParametro.COLIFORMES]: "Coliformes",
  };
  return params.map((p) => labels[p] ?? p);
}

function buildClasificacion(
  muestraId: string,
  estacionId: string,
  params: ParametrosFisicoquimicos,
  estacionCodigo: string,
  fechaMuestreo: string,
  now: string
): ClasificacionECA {
  const result = classifyParametros(params, estacionCodigo, fechaMuestreo);
  return {
    id: `eca-${muestraId}`,
    muestraId,
    estacionId,
    estado: result.status as EstadoECA,
    parametrosViolados: result.violatedParameters as TipoParametro[],
    parametrosEnAlerta: result.alertParameters as TipoParametro[],
    evaluadoEn: now,
    normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa)",
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };
}

function buildParametros(
  muestraId: string,
  estacionId: string,
  payload: CreateMuestraPayload,
  now: string
): ParametrosFisicoquimicos {
  return {
    id: `param-${muestraId}`,
    muestraId,
    estacionId,
    ph: payload.ph,
    turbidez: payload.turbidez,
    conductividad: payload.conductividad,
    oxigenoDisuelto: payload.oxigenoDisuelto,
    temperatura: payload.temperatura,
    dbo5: 0,
    dqo: 0,
    solidosDisueltosTotales: payload.solidosDisueltosTotales,
    caudal: payload.caudal,
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };
}

export function getAllSampleSummaries(campanaId?: string): MuestraSummary[] {
  let muestras = getDataStore().muestras;
  if (campanaId) muestras = muestras.filter((m) => m.campanaId === campanaId);
  return muestras.map(toSummary).sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo));
}

export function getSampleDetailById(id: string): MuestraDetail | null {
  const muestra = getDataStore().muestras.find((m) => m.id === id);
  if (!muestra) return null;

  const params = getDataStore().parametros.find((p) => p.muestraId === id);
  const clasificacion = getDataStore().clasificaciones.find((c) => c.muestraId === id);
  if (!params) return null;

  const summary = toSummary(muestra);
  return {
    ...summary,
    observaciones: muestra.observaciones ?? "",
    parametros: {
      ph: params.ph,
      temperatura: params.temperatura,
      conductividad: params.conductividad,
      oxigenoDisuelto: params.oxigenoDisuelto,
      turbidez: params.turbidez,
      solidosDisueltosTotales: params.solidosDisueltosTotales,
      caudal: params.caudal,
      colorAparente: muestra.colorAparente,
    },
    parametrosViolados: mapViolatedToLabels(clasificacion?.parametrosViolados ?? []),
    parametrosEnAlerta: mapViolatedToLabels(clasificacion?.parametrosEnAlerta ?? []),
    normativaReferencia:
      clasificacion?.normativaReferencia ??
      "ECA Agua — Cuerpos receptores (referencia orientativa)",
    evaluadoEn: clasificacion?.evaluadoEn ?? muestra.fechaMuestreo,
    createdAt: muestra.createdAt,
    updatedAt: muestra.updatedAt,
  };
}

export function getSampleStats(campanaId?: string): SampleStats {
  const summaries = getAllSampleSummaries(campanaId);
  return {
    total: summaries.length,
    cumple: summaries.filter((s) => s.estadoECA === "compliant").length,
    alerta: summaries.filter((s) => s.estadoECA === "alert").length,
    noCumple: summaries.filter((s) => s.estadoECA === "non_compliant").length,
  };
}

export function getEstacionesByCampana(campanaId: string) {
  const campana = getDataStore().campanas.find((c) => c.id === campanaId);
  if (!campana) return [];
  return getDataStore().estaciones
    .filter((e) => e.rioId === campana.rioId)
    .map((e) => ({ value: e.id, label: `${e.codigo} — ${e.nombre}`, codigo: e.codigo }));
}

export function getCampanasForSampling() {
  return getDataStore().campanas.map((c) => ({
    value: c.id,
    label: `${c.codigo} — ${c.nombre}`,
  }));
}

export function createMuestra(payload: CreateMuestraPayload): SampleOperationResult {
  const campana = getDataStore().campanas.find((c) => c.id === payload.campanaId);
  const estacion = getDataStore().estaciones.find((e) => e.id === payload.estacionId);

  if (!campana) return { success: false, message: "La campaña seleccionada no existe." };
  if (!estacion || estacion.rioId !== campana.rioId) {
    return { success: false, message: "La estación no pertenece a la campaña seleccionada." };
  }

  const now = MOCK_LAST_UPDATE;
  const muestraId = `muestra-${Date.now()}`;
  const fechaPart = payload.fechaMuestreo.slice(0, 10);
  const codigoBase = generateCodigoMuestra(estacion.codigo, fechaPart);
  const existingCount = getDataStore().muestras.filter((m) =>
    m.codigoMuestra.startsWith(codigoBase)
  ).length;
  const codigoMuestra = existingCount > 0 ? `${codigoBase}-${existingCount + 1}` : codigoBase;

  const muestra: Muestra = {
    id: muestraId,
    campanaId: payload.campanaId,
    estacionId: payload.estacionId,
    codigoMuestra,
    fechaMuestreo: payload.fechaMuestreo,
    responsableId: payload.responsableId,
    clima: payload.clima,
    colorAparente: payload.colorAparente,
    observaciones: payload.observaciones,
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };

  const parametros = buildParametros(muestraId, payload.estacionId, payload, now);
  const clasificacion = buildClasificacion(
    muestraId,
    payload.estacionId,
    parametros,
    estacion.codigo,
    payload.fechaMuestreo,
    now
  );

  getDataStore().muestras.push(muestra);
  getDataStore().parametros.push(parametros);
  getDataStore().clasificaciones.push(clasificacion);

  return {
    success: true,
    message: `Muestra ${codigoMuestra} registrada correctamente.`,
    sample: toSummary(muestra),
  };
}

export function updateMuestra(id: string, payload: CreateMuestraPayload): SampleOperationResult {
  const index = getDataStore().muestras.findIndex((m) => m.id === id);
  if (index === -1) return { success: false, message: "La muestra no existe." };

  const campana = getDataStore().campanas.find((c) => c.id === payload.campanaId);
  const estacion = getDataStore().estaciones.find((e) => e.id === payload.estacionId);
  if (!campana || !estacion || estacion.rioId !== campana.rioId) {
    return { success: false, message: "Campaña o estación no válida." };
  }

  const now = MOCK_LAST_UPDATE;
  const existing = getDataStore().muestras[index];

  getDataStore().muestras[index] = {
    ...existing,
    campanaId: payload.campanaId,
    estacionId: payload.estacionId,
    fechaMuestreo: payload.fechaMuestreo,
    responsableId: payload.responsableId,
    clima: payload.clima,
    colorAparente: payload.colorAparente,
    observaciones: payload.observaciones,
    updatedAt: now,
  };

  const paramIndex = getDataStore().parametros.findIndex((p) => p.muestraId === id);
  const parametros = buildParametros(id, payload.estacionId, payload, now);

  let parametrosRecord: ParametrosFisicoquimicos;
  if (paramIndex >= 0) {
    parametrosRecord = { ...parametros, id: getDataStore().parametros[paramIndex].id };
    getDataStore().parametros[paramIndex] = parametrosRecord;
  } else {
    getDataStore().parametros.push(parametros);
    parametrosRecord = parametros;
  }

  const clasIndex = getDataStore().clasificaciones.findIndex((c) => c.muestraId === id);
  const clasificacion = buildClasificacion(
    id,
    payload.estacionId,
    parametrosRecord,
    estacion.codigo,
    payload.fechaMuestreo,
    now
  );
  if (clasIndex >= 0) {
    getDataStore().clasificaciones[clasIndex] = {
      ...clasificacion,
      id: getDataStore().clasificaciones[clasIndex].id,
    };
  } else {
    getDataStore().clasificaciones.push(clasificacion);
  }

  return {
    success: true,
    message: `Muestra ${existing.codigoMuestra} actualizada correctamente.`,
    sample: toSummary(getDataStore().muestras[index]),
  };
}

export function deleteMuestra(id: string): SampleOperationResult {
  const muestra = getDataStore().muestras.find((m) => m.id === id);
  if (!muestra) return { success: false, message: "La muestra no existe." };

  getDataStore().muestras = getDataStore().muestras.filter((m) => m.id !== id);
  getDataStore().parametros = getDataStore().parametros.filter((p) => p.muestraId !== id);
  getDataStore().clasificaciones = getDataStore().clasificaciones.filter((c) => c.muestraId !== id);

  return {
    success: true,
    message: `Muestra ${muestra.codigoMuestra} eliminada correctamente.`,
  };
}
