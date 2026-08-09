"use client";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import { CLIMA_OPTIONS, COLOR_APARENTE_OPTIONS } from "@/constants/sampling";
import { fetchSampleDetail } from "@/lib/api/samples.client";
import {
  getCampanasForSampling,
  getEstacionesByCampana,
} from "@/lib/repositories/sample.repository";
import { getResponsablesOptions } from "@/lib/repositories/campaign.repository";
import { parseFechaMuestreo } from "@/lib/sampling/sampling-utils";
import { sampleFormSchema, type SampleFormValues } from "@/lib/validators/form-schemas";
import type { CreateMuestraPayload } from "@/types/sampling";

interface SampleFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  editId?: string;
  defaultCampanaId?: string;
  onClose: () => void;
  onSubmit: (payload: CreateMuestraPayload, editId?: string) => void | Promise<void>;
}

const EMPTY_VALUES: SampleFormValues = {
  campanaId: "",
  fecha: "",
  hora: "",
  estacionId: "",
  responsableId: "",
  clima: "",
  observaciones: "",
  colorAparente: "",
  ph: 0,
  temperatura: 0,
  conductividad: 0,
  oxigenoDisuelto: 0,
  turbidez: 0,
  solidosDisueltosTotales: 0,
  caudal: 0,
};

function toPayload(values: SampleFormValues): CreateMuestraPayload {
  return {
    campanaId: values.campanaId,
    fechaMuestreo: `${values.fecha}T${values.hora}:00`,
    estacionId: values.estacionId,
    responsableId: values.responsableId,
    clima: values.clima,
    colorAparente: values.colorAparente,
    observaciones: values.observaciones,
    ph: values.ph,
    temperatura: values.temperatura,
    conductividad: values.conductividad,
    oxigenoDisuelto: values.oxigenoDisuelto,
    turbidez: values.turbidez,
    solidosDisueltosTotales: values.solidosDisueltosTotales,
    caudal: values.caudal,
  };
}

export function SampleFormModal({
  open,
  mode,
  editId,
  defaultCampanaId = "",
  onClose,
  onSubmit,
}: SampleFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema) as Resolver<SampleFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const campanaId = watch("campanaId");

  const loadEditData = useCallback(
    async (id: string) => {
      const detail = await fetchSampleDetail(id);
      const { fecha, hora } = parseFechaMuestreo(detail.fechaMuestreo);
      reset({
        campanaId: detail.campanaId,
        fecha,
        hora,
        estacionId: detail.estacionId,
        responsableId: detail.responsableId,
        clima: detail.clima,
        observaciones: detail.observaciones,
        colorAparente: detail.colorAparente,
        ph: detail.parametros.ph,
        temperatura: detail.parametros.temperatura,
        conductividad: detail.parametros.conductividad,
        oxigenoDisuelto: detail.parametros.oxigenoDisuelto,
        turbidez: detail.parametros.turbidez,
        solidosDisueltosTotales: detail.parametros.solidosDisueltosTotales,
        caudal: detail.parametros.caudal,
      });
    },
    [reset]
  );

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editId) {
      void loadEditData(editId);
    } else {
      reset({ ...EMPTY_VALUES, campanaId: defaultCampanaId });
    }
  }, [open, mode, editId, defaultCampanaId, loadEditData, reset]);

  const estacionOptions = campanaId
    ? [{ value: "", label: "Seleccionar estación…" }, ...getEstacionesByCampana(campanaId)]
    : [{ value: "", label: "Seleccione una campaña primero" }];

  const resetAndClose = () => {
    reset(EMPTY_VALUES);
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(toPayload(values), mode === "edit" ? editId : undefined);
    resetAndClose();
  });

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={mode === "create" ? "Registrar Muestra" : "Editar Muestra"}
      description="Complete todos los campos. Los parámetros se clasificarán automáticamente según ECA."
      className="max-w-2xl"
    >
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        <FormField id="sf-campana" label="Campaña" required>
          <FilterSelect
            id="sf-campana"
            label="Campaña"
            hideLabel
            value={campanaId}
            options={[{ value: "", label: "Seleccionar campaña…" }, ...getCampanasForSampling()]}
            onChange={(v) => {
              setValue("campanaId", v, { shouldValidate: true });
              setValue("estacionId", "");
            }}
            disabled={mode === "edit"}
          />
          {errors.campanaId && <FieldError message={errors.campanaId.message} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-fecha" label="Fecha" required>
            <TextInput id="sf-fecha" type="date" {...register("fecha")} />
            {errors.fecha && <FieldError message={errors.fecha.message} />}
          </FormField>
          <FormField id="sf-hora" label="Hora" required>
            <TextInput id="sf-hora" type="time" {...register("hora")} />
            {errors.hora && <FieldError message={errors.hora.message} />}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-estacion" label="Estación" required>
            <FilterSelect
              id="sf-estacion"
              label="Estación"
              hideLabel
              value={watch("estacionId")}
              options={estacionOptions}
              onChange={(v) => setValue("estacionId", v, { shouldValidate: true })}
              disabled={!campanaId}
            />
            {errors.estacionId && <FieldError message={errors.estacionId.message} />}
          </FormField>
          <FormField id="sf-responsable" label="Responsable" required>
            <FilterSelect
              id="sf-responsable"
              label="Responsable"
              hideLabel
              value={watch("responsableId")}
              options={[{ value: "", label: "Seleccionar…" }, ...getResponsablesOptions()]}
              onChange={(v) => setValue("responsableId", v, { shouldValidate: true })}
            />
            {errors.responsableId && <FieldError message={errors.responsableId.message} />}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="sf-clima" label="Clima" required>
            <FilterSelect
              id="sf-clima"
              label="Clima"
              hideLabel
              value={watch("clima")}
              options={[{ value: "", label: "Seleccionar clima…" }, ...CLIMA_OPTIONS]}
              onChange={(v) => setValue("clima", v, { shouldValidate: true })}
            />
            {errors.clima && <FieldError message={errors.clima.message} />}
          </FormField>
          <FormField id="sf-color" label="Color aparente" required>
            <FilterSelect
              id="sf-color"
              label="Color"
              hideLabel
              value={watch("colorAparente")}
              options={[{ value: "", label: "Seleccionar color…" }, ...COLOR_APARENTE_OPTIONS]}
              onChange={(v) => setValue("colorAparente", v, { shouldValidate: true })}
            />
            {errors.colorAparente && <FieldError message={errors.colorAparente.message} />}
          </FormField>
        </div>

        <FormField id="sf-obs" label="Observaciones" required>
          <TextArea id="sf-obs" {...register("observaciones")} placeholder="Condiciones de campo, anomalías, etc." />
          {errors.observaciones && <FieldError message={errors.observaciones.message} />}
        </FormField>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Parámetros fisicoquímicos
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ParamField id="sf-ph" label="pH" unit="—" error={errors.ph?.message} {...register("ph")} />
            <ParamField id="sf-temp" label="Temperatura" unit="°C" error={errors.temperatura?.message} {...register("temperatura")} />
            <ParamField id="sf-cond" label="Conductividad" unit="µS/cm" error={errors.conductividad?.message} {...register("conductividad")} />
            <ParamField id="sf-od" label="Oxígeno disuelto" unit="mg/L" error={errors.oxigenoDisuelto?.message} {...register("oxigenoDisuelto")} />
            <ParamField id="sf-turb" label="Turbidez" unit="NTU" error={errors.turbidez?.message} {...register("turbidez")} />
            <ParamField id="sf-std" label="Sólidos disueltos" unit="mg/L" error={errors.solidosDisueltosTotales?.message} {...register("solidosDisueltosTotales")} />
            <ParamField id="sf-caudal" label="Caudal" unit="m³/s" error={errors.caudal?.message} {...register("caudal")} />
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
  error,
  ...inputProps
}: {
  id: string;
  label: string;
  unit: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField id={id} label={`${label} (${unit})`} required>
      <TextInput id={id} type="number" step="any" min="0" {...inputProps} />
      {error && <FieldError message={error} />}
    </FormField>
  );
}
