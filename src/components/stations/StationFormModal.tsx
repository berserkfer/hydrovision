"use client";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import { getCuencasOptions, getRiosByCuenca } from "@/lib/repositories/campaign.repository";
import { stationFormSchema, type StationFormValues } from "@/lib/validators/form-schemas";
import type { CreateStationInput } from "@/server/validators/schemas/crud.schemas";
import type { MonitoringStationRecord } from "@/types/station-management";

interface StationFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  station?: MonitoringStationRecord | null;
  onClose: () => void;
  onSubmit: (input: CreateStationInput, editId?: string) => void | Promise<void>;
}

const EMPTY_VALUES: StationFormValues = {
  codigo: "",
  nombre: "",
  cuencaId: "",
  rioId: "",
  tramo: "",
  altitud: 0,
  latitud: -6.7,
  longitud: -79.8,
  estado: "active",
  descripcion: "",
  entidadResponsable: "",
};

export function StationFormModal({
  open,
  mode,
  station,
  onClose,
  onSubmit,
}: StationFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema) as Resolver<StationFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const cuencaId = watch("cuencaId");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && station) {
      reset({
        codigo: station.codigo,
        nombre: station.nombre,
        cuencaId: station.cuencaId,
        rioId: station.rioId,
        tramo: station.tramo,
        altitud: station.altitud,
        latitud: station.latitud,
        longitud: station.longitud,
        estado: station.estado,
        descripcion: station.descripcion,
        entidadResponsable: "",
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, mode, station, reset]);

  const rioOptions = cuencaId
    ? [{ value: "", label: "Seleccionar río…" }, ...getRiosByCuenca(cuencaId)]
    : [{ value: "", label: "Seleccione una cuenca primero" }];

  const resetAndClose = useCallback(() => {
    reset(EMPTY_VALUES);
    onClose();
  }, [onClose, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateStationInput = {
      codigo: values.codigo,
      nombre: values.nombre,
      cuencaId: values.cuencaId,
      rioId: values.rioId,
      tramo: values.tramo,
      altitud: values.altitud,
      latitud: values.latitud,
      longitud: values.longitud,
      estado: values.estado,
      descripcion: values.descripcion,
      entidadResponsable: values.entidadResponsable,
    };
    await onSubmit(payload, mode === "edit" ? station?.id : undefined);
    resetAndClose();
  });

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={mode === "create" ? "Nueva Estación" : "Editar Estación"}
      description="Registre un punto de monitoreo con coordenadas geográficas validadas."
      className="max-w-2xl"
    >
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="st-codigo" label="Código" required>
            <TextInput id="st-codigo" {...register("codigo")} placeholder="Ej. E-01" />
            {errors.codigo && <FieldError message={errors.codigo.message} />}
          </FormField>
          <FormField id="st-estado" label="Estado" required>
            <FilterSelect
              id="st-estado"
              label="Estado"
              hideLabel
              value={watch("estado")}
              options={[
                { value: "active", label: "Activa" },
                { value: "maintenance", label: "Mantenimiento" },
                { value: "offline", label: "Inactiva" },
              ]}
              onChange={(v) => setValue("estado", v as StationFormValues["estado"], { shouldValidate: true })}
            />
          </FormField>
        </div>

        <FormField id="st-nombre" label="Nombre" required>
          <TextInput id="st-nombre" {...register("nombre")} />
          {errors.nombre && <FieldError message={errors.nombre.message} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="st-cuenca" label="Cuenca" required>
            <FilterSelect
              id="st-cuenca"
              label="Cuenca"
              hideLabel
              value={cuencaId}
              options={[{ value: "", label: "Seleccionar cuenca…" }, ...getCuencasOptions()]}
              onChange={(v) => {
                setValue("cuencaId", v, { shouldValidate: true });
                setValue("rioId", "");
              }}
            />
            {errors.cuencaId && <FieldError message={errors.cuencaId.message} />}
          </FormField>
          <FormField id="st-rio" label="Río" required>
            <FilterSelect
              id="st-rio"
              label="Río"
              hideLabel
              value={watch("rioId")}
              options={rioOptions}
              onChange={(v) => setValue("rioId", v, { shouldValidate: true })}
              disabled={!cuencaId}
            />
            {errors.rioId && <FieldError message={errors.rioId.message} />}
          </FormField>
        </div>

        <FormField id="st-tramo" label="Tramo" required>
          <TextInput id="st-tramo" {...register("tramo")} />
          {errors.tramo && <FieldError message={errors.tramo.message} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="st-lat" label="Latitud" required>
            <TextInput id="st-lat" type="number" step="any" {...register("latitud")} />
            {errors.latitud && <FieldError message={errors.latitud.message} />}
          </FormField>
          <FormField id="st-lng" label="Longitud" required>
            <TextInput id="st-lng" type="number" step="any" {...register("longitud")} />
            {errors.longitud && <FieldError message={errors.longitud.message} />}
          </FormField>
          <FormField id="st-alt" label="Altitud (m)" required>
            <TextInput id="st-alt" type="number" step="any" {...register("altitud")} />
            {errors.altitud && <FieldError message={errors.altitud.message} />}
          </FormField>
        </div>

        <FormField id="st-entidad" label="Entidad responsable">
          <TextInput id="st-entidad" {...register("entidadResponsable")} />
        </FormField>

        <FormField id="st-desc" label="Descripción">
          <TextArea id="st-desc" {...register("descripcion")} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={resetAndClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">
            {mode === "create" ? "Registrar estación" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
