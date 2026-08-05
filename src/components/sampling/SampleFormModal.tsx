"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import { CLIMA_OPTIONS, COLOR_APARENTE_OPTIONS } from "@/constants/sampling";
import {
  getCampanasForSampling,
  getEstacionesByCampana,
} from "@/lib/repositories/sample.repository";
import { getResponsablesOptions } from "@/lib/repositories/campaign.repository";
import { parseFechaMuestreo, validateSampleForm } from "@/lib/sampling/sampling-utils";
import { getSampleDetailById } from "@/lib/repositories/sample.repository";
import type { CreateMuestraPayload, SampleFormErrors, SampleFormInput } from "@/types/sampling";
import { EMPTY_SAMPLE_FORM } from "@/types/sampling";

interface SampleFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  editId?: string;
  defaultCampanaId?: string;
  onClose: () => void;
  onSubmit: (payload: CreateMuestraPayload, editId?: string) => void;
}

export function SampleFormModal({
  open,
  mode,
  editId,
  defaultCampanaId = "",
  onClose,
  onSubmit,
}: SampleFormModalProps) {
  const [form, setForm] = useState<SampleFormInput>(EMPTY_SAMPLE_FORM);
  const [errors, setErrors] = useState<SampleFormErrors>({});

  const loadEditData = useCallback((id: string) => {
    const detail = getSampleDetailById(id);
    if (!detail) return;
    const { fecha, hora } = parseFechaMuestreo(detail.fechaMuestreo);
    setForm({
      campanaId: detail.campanaId,
      fecha,
      hora,
      estacionId: detail.estacionId,
      responsableId: detail.responsableId,
      clima: detail.clima,
      observaciones: detail.observaciones,
      colorAparente: detail.colorAparente,
      ph: String(detail.parametros.ph),
      temperatura: String(detail.parametros.temperatura),
      conductividad: String(detail.parametros.conductividad),
      oxigenoDisuelto: String(detail.parametros.oxigenoDisuelto),
      turbidez: String(detail.parametros.turbidez),
      solidosDisueltosTotales: String(detail.parametros.solidosDisueltosTotales),
      caudal: String(detail.parametros.caudal),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editId) {
      loadEditData(editId);
    } else {
      setForm({ ...EMPTY_SAMPLE_FORM, campanaId: defaultCampanaId });
    }
    setErrors({});
  }, [open, mode, editId, defaultCampanaId, loadEditData]);

  const estacionOptions = form.campanaId
    ? [{ value: "", label: "Seleccionar estación…" }, ...getEstacionesByCampana(form.campanaId)]
    : [{ value: "", label: "Seleccione una campaña primero" }];

  const resetAndClose = () => {
    setForm(EMPTY_SAMPLE_FORM);
    setErrors({});
    onClose();
  };

  const setField = <K extends keyof SampleFormInput>(key: K, value: SampleFormInput[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "campanaId") next.estacionId = "";
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateSampleForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.payload, mode === "edit" ? editId : undefined);
    resetAndClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={mode === "create" ? "Registrar Muestra" : "Editar Muestra"}
      description="Complete todos los campos. Los parámetros se clasificarán automáticamente según ECA."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        <FormField id="sf-campana" label="Campaña" required>
          <FilterSelect
            id="sf-campana"
            label="Campaña"
            hideLabel
            value={form.campanaId}
            options={[{ value: "", label: "Seleccionar campaña…" }, ...getCampanasForSampling()]}
            onChange={(v) => setField("campanaId", v)}
            disabled={mode === "edit"}
          />
          {errors.campanaId && <FieldError message={errors.campanaId} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-fecha" label="Fecha" required>
            <TextInput id="sf-fecha" type="date" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)} />
            {errors.fecha && <FieldError message={errors.fecha} />}
          </FormField>
          <FormField id="sf-hora" label="Hora" required>
            <TextInput id="sf-hora" type="time" value={form.hora} onChange={(e) => setField("hora", e.target.value)} />
            {errors.hora && <FieldError message={errors.hora} />}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-estacion" label="Estación" required>
            <FilterSelect
              id="sf-estacion"
              label="Estación"
              hideLabel
              value={form.estacionId}
              options={estacionOptions}
              onChange={(v) => setField("estacionId", v)}
              disabled={!form.campanaId}
            />
            {errors.estacionId && <FieldError message={errors.estacionId} />}
          </FormField>
          <FormField id="sf-responsable" label="Responsable" required>
            <FilterSelect
              id="sf-responsable"
              label="Responsable"
              hideLabel
              value={form.responsableId}
              options={[{ value: "", label: "Seleccionar…" }, ...getResponsablesOptions()]}
              onChange={(v) => setField("responsableId", v)}
            />
            {errors.responsableId && <FieldError message={errors.responsableId} />}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-clima" label="Clima" required>
            <FilterSelect
              id="sf-clima"
              label="Clima"
              hideLabel
              value={form.clima}
              options={[{ value: "", label: "Seleccionar clima…" }, ...CLIMA_OPTIONS]}
              onChange={(v) => setField("clima", v)}
            />
            {errors.clima && <FieldError message={errors.clima} />}
          </FormField>
          <FormField id="sf-color" label="Color aparente" required>
            <FilterSelect
              id="sf-color"
              label="Color"
              hideLabel
              value={form.colorAparente}
              options={[{ value: "", label: "Seleccionar color…" }, ...COLOR_APARENTE_OPTIONS]}
              onChange={(v) => setField("colorAparente", v)}
            />
            {errors.colorAparente && <FieldError message={errors.colorAparente} />}
          </FormField>
        </div>

        <FormField id="sf-obs" label="Observaciones" required>
          <TextArea
            id="sf-obs"
            value={form.observaciones}
            onChange={(e) => setField("observaciones", e.target.value)}
            placeholder="Condiciones de campo, anomalías, etc."
          />
          {errors.observaciones && <FieldError message={errors.observaciones} />}
        </FormField>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Parámetros fisicoquímicos
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ParamField id="sf-ph" label="pH" unit="—" value={form.ph} error={errors.ph} onChange={(v) => setField("ph", v)} />
            <ParamField id="sf-temp" label="Temperatura" unit="°C" value={form.temperatura} error={errors.temperatura} onChange={(v) => setField("temperatura", v)} />
            <ParamField id="sf-cond" label="Conductividad" unit="µS/cm" value={form.conductividad} error={errors.conductividad} onChange={(v) => setField("conductividad", v)} />
            <ParamField id="sf-od" label="Oxígeno disuelto" unit="mg/L" value={form.oxigenoDisuelto} error={errors.oxigenoDisuelto} onChange={(v) => setField("oxigenoDisuelto", v)} />
            <ParamField id="sf-turb" label="Turbidez" unit="NTU" value={form.turbidez} error={errors.turbidez} onChange={(v) => setField("turbidez", v)} />
            <ParamField id="sf-std" label="Sólidos disueltos" unit="mg/L" value={form.solidosDisueltosTotales} error={errors.solidosDisueltosTotales} onChange={(v) => setField("solidosDisueltosTotales", v)} />
            <ParamField id="sf-caudal" label="Caudal" unit="m³/s" value={form.caudal} error={errors.caudal} onChange={(v) => setField("caudal", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={resetAndClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">
            {mode === "create" ? "Registrar muestra" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ParamField({
  id,
  label,
  unit,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormField id={id} label={`${label} (${unit})`} required>
      <TextInput id={id} type="number" step="any" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <FieldError message={error} />}
    </FormField>
  );
}
