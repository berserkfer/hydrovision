"use client";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import {
  getCuencasOptions,
  getEstacionesByRio,
  getResponsablesOptions,
  getRiosByCuenca,
} from "@/lib/repositories/campaign.repository";
import {
  campaignFormSchema,
  type CampaignFormValues,
} from "@/lib/validators/form-schemas";
import type { CreateCampanaInput } from "@/types/campaign";

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCampanaInput) => void | Promise<void>;
}

const EMPTY_VALUES: CampaignFormValues = {
  nombre: "",
  responsableId: "",
  fecha: "",
  cuencaId: "",
  rioId: "",
  objetivo: "",
  descripcion: "",
  estacionIds: [],
  observaciones: "",
};

export function CampaignForm({ open, onClose, onSubmit }: CampaignFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema) as Resolver<CampaignFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const cuencaId = watch("cuencaId");
  const rioId = watch("rioId");
  const estacionIds = watch("estacionIds") ?? [];

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const rioOptions = cuencaId
    ? [{ value: "", label: "Seleccionar río…" }, ...getRiosByCuenca(cuencaId)]
    : [{ value: "", label: "Seleccione una cuenca primero" }];

  const estacionOptions = rioId ? getEstacionesByRio(rioId) : [];

  const resetAndClose = useCallback(() => {
    reset(EMPTY_VALUES);
    onClose();
  }, [onClose, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      nombre: values.nombre,
      responsableId: values.responsableId,
      fecha: values.fecha,
      cuencaId: values.cuencaId,
      rioId: values.rioId,
      objetivo: values.objetivo,
      descripcion: values.descripcion ?? "",
      estacionIds: values.estacionIds ?? [],
      observaciones: values.observaciones ?? "",
    });
    resetAndClose();
  });

  const toggleEstacion = (estacionId: string) => {
    const next = estacionIds.includes(estacionId)
      ? estacionIds.filter((id) => id !== estacionId)
      : [...estacionIds, estacionId];
    setValue("estacionIds", next);
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Nueva Campaña"
      description="Registre una campaña de monitoreo ambiental. Los datos se guardan en memoria (simulado)."
    >
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        <FormField id="camp-nombre" label="Nombre" required>
          <TextInput id="camp-nombre" {...register("nombre")} placeholder="Ej. Campaña Seca 2025 — Reque" />
          {errors.nombre && <FieldError message={errors.nombre.message} />}
        </FormField>

        <FormField id="camp-fecha" label="Fecha de inicio" required>
          <TextInput id="camp-fecha" type="date" {...register("fecha")} />
          {errors.fecha && <FieldError message={errors.fecha.message} />}
        </FormField>

        <FormField id="camp-responsable" label="Responsable" required>
          <FilterSelect
            id="camp-responsable"
            label="Responsable"
            hideLabel
            value={watch("responsableId")}
            options={[{ value: "", label: "Seleccionar responsable…" }, ...getResponsablesOptions()]}
            onChange={(v) => setValue("responsableId", v, { shouldValidate: true })}
          />
          {errors.responsableId && <FieldError message={errors.responsableId.message} />}
        </FormField>

        <FormField id="camp-objetivo" label="Objetivo" required>
          <TextArea id="camp-objetivo" {...register("objetivo")} placeholder="Objetivo principal de la campaña…" />
          {errors.objetivo && <FieldError message={errors.objetivo.message} />}
        </FormField>

        <FormField id="camp-descripcion" label="Descripción">
          <TextArea id="camp-descripcion" {...register("descripcion")} placeholder="Alcance, metodología o contexto de la campaña…" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="camp-cuenca" label="Cuenca" required>
            <FilterSelect
              id="camp-cuenca"
              label="Cuenca"
              hideLabel
              value={cuencaId}
              options={[{ value: "", label: "Seleccionar cuenca…" }, ...getCuencasOptions()]}
              onChange={(v) => {
                setValue("cuencaId", v, { shouldValidate: true });
                setValue("rioId", "");
                setValue("estacionIds", []);
              }}
            />
            {errors.cuencaId && <FieldError message={errors.cuencaId.message} />}
          </FormField>

          <FormField id="camp-rio" label="Río" required>
            <FilterSelect
              id="camp-rio"
              label="Río"
              hideLabel
              value={rioId}
              options={rioOptions}
              onChange={(v) => {
                setValue("rioId", v, { shouldValidate: true });
                setValue("estacionIds", []);
              }}
              disabled={!cuencaId}
            />
            {errors.rioId && <FieldError message={errors.rioId.message} />}
          </FormField>
        </div>

        {estacionOptions.length > 0 && (
          <FormField id="camp-estaciones" label="Estaciones seleccionadas">
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {estacionOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={estacionIds.includes(opt.value)}
                    onChange={() => toggleEstacion(opt.value)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {opt.label}
                </label>
              ))}
              <p className="text-[10px] text-slate-400">
                Si no selecciona ninguna, se incluirán todas las estaciones del río.
              </p>
            </div>
          </FormField>
        )}

        <FormField id="camp-obs" label="Observaciones">
          <TextArea id="camp-obs" {...register("observaciones")} placeholder="Notas adicionales de la campaña…" />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700"
          >
            Guardar campaña
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Alias para compatibilidad con implementación anterior */
export function CampaignFormModal(props: CampaignFormProps) {
  return <CampaignForm {...props} />;
}
