/**
 * Validación y clasificación ECA para muestreos.
 * Fechas centralizadas en @/utils.
 */

import { CLIMA_OPTIONS, COLOR_APARENTE_OPTIONS } from "@/constants/sampling";
import { classifyMeasurement } from "@/lib/eca/classifier";
import type { ParametrosFisicoquimicos } from "@/models/monitoring";
import type {
  CreateMuestraPayload,
  SampleFormErrors,
  SampleFormInput,
} from "@/types/sampling";
import type { ComplianceResult, FieldMeasurement } from "@/types";
import { buildFechaMuestreo } from "@/utils";

export { buildFechaMuestreo, parseFechaMuestreo } from "@/utils";

function isValidNumber(value: string, min = 0): boolean {
  const n = Number(value);
  return value.trim() !== "" && !Number.isNaN(n) && n >= min;
}

function isPhValid(value: string): boolean {
  const n = Number(value);
  return value.trim() !== "" && !Number.isNaN(n) && n >= 0 && n <= 14;
}

export function validateSampleForm(
  form: SampleFormInput
): { ok: true; payload: CreateMuestraPayload } | { ok: false; errors: SampleFormErrors } {
  const errors: SampleFormErrors = {};

  if (!form.campanaId) errors.campanaId = "Seleccione una campaña";
  if (!form.fecha) errors.fecha = "La fecha es obligatoria";
  if (!form.hora) errors.hora = "La hora es obligatoria";
  if (!form.estacionId) errors.estacionId = "Seleccione una estación";
  if (!form.responsableId) errors.responsableId = "Seleccione un responsable";
  if (!form.clima) errors.clima = "Seleccione la condición climática";
  if (!form.colorAparente) errors.colorAparente = "Seleccione el color aparente";
  if (!form.observaciones.trim()) errors.observaciones = "Las observaciones son obligatorias";

  if (!isPhValid(form.ph)) errors.ph = "Ingrese un pH válido (0–14)";
  if (!isValidNumber(form.temperatura)) errors.temperatura = "Ingrese una temperatura válida";
  if (!isValidNumber(form.conductividad)) errors.conductividad = "Ingrese una conductividad válida";
  if (!isValidNumber(form.oxigenoDisuelto)) errors.oxigenoDisuelto = "Ingrese oxígeno disuelto válido";
  if (!isValidNumber(form.turbidez)) errors.turbidez = "Ingrese turbidez válida";
  if (!isValidNumber(form.solidosDisueltosTotales))
    errors.solidosDisueltosTotales = "Ingrese sólidos disueltos válidos";
  if (!isValidNumber(form.caudal)) errors.caudal = "Ingrese caudal válido";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      campanaId: form.campanaId,
      fechaMuestreo: buildFechaMuestreo(form.fecha, form.hora),
      estacionId: form.estacionId,
      responsableId: form.responsableId,
      clima: form.clima,
      colorAparente: form.colorAparente,
      observaciones: form.observaciones.trim(),
      ph: Number(form.ph),
      temperatura: Number(form.temperatura),
      conductividad: Number(form.conductividad),
      oxigenoDisuelto: Number(form.oxigenoDisuelto),
      turbidez: Number(form.turbidez),
      solidosDisueltosTotales: Number(form.solidosDisueltosTotales),
      caudal: Number(form.caudal),
    },
  };
}

export function parametrosToECAMeasurement(
  params: ParametrosFisicoquimicos,
  estacionCodigo: string,
  fechaMuestreo: string
): FieldMeasurement {
  return {
    id: params.id,
    stationId: estacionCodigo,
    sampledAt: fechaMuestreo,
    ph: params.ph,
    turbidity: params.turbidez,
    conductivity: params.conductividad,
    dissolvedOxygen: params.oxigenoDisuelto,
    temperature: params.temperatura,
    bod5: params.dbo5,
    cod: params.dqo,
    coliformes: params.coliformes,
    isSimulated: true,
  };
}

export function classifyParametros(
  params: ParametrosFisicoquimicos,
  estacionCodigo: string,
  fechaMuestreo: string
): ComplianceResult {
  return classifyMeasurement(
    parametrosToECAMeasurement(params, estacionCodigo, fechaMuestreo)
  );
}

export function generateCodigoMuestra(estacionCodigo: string, fecha: string): string {
  return `${estacionCodigo}-${fecha.replace(/-/g, "")}`;
}
