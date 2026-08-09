"use client";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import { parameterFormSchema, type ParameterFormValues } from "@/lib/validators/form-schemas";
import type { CreateParameterInput } from "@/server/validators/schemas/crud.schemas";

interface ParameterFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateParameterInput) => void | Promise<void>;
}

const EMPTY_VALUES: ParameterFormValues = {
  codigo: "",
  nombre: "",
  unidad: "",
  descripcion: "",
  limiteEcaMin: undefined,
  limiteEcaMax: undefined,
};

export function ParameterFormModal({ open, onClose, onSubmit }: ParameterFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParameterFormValues>({
    resolver: zodResolver(parameterFormSchema) as Resolver<ParameterFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const resetAndClose = useCallback(() => {
    reset(EMPTY_VALUES);
    onClose();
  }, [onClose, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      codigo: values.codigo,
      nombre: values.nombre,
      unidad: values.unidad,
      descripcion: values.descripcion,
      limiteEcaMin: values.limiteEcaMin,
      limiteEcaMax: values.limiteEcaMax,
    });
    resetAndClose();
  });

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Nuevo Parámetro"
      description="Agregue un parámetro al catálogo de calidad del agua."
    >
      <form onSubmit={submit} className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="param-codigo" label="Código" required>
            <TextInput id="param-codigo" {...register("codigo")} placeholder="Ej. temperature" />
            {errors.codigo && <FieldError message={errors.codigo.message} />}
          </FormField>
          <FormField id="param-unidad" label="Unidad" required>
            <TextInput id="param-unidad" {...register("unidad")} placeholder="Ej. mg/L" />
            {errors.unidad && <FieldError message={errors.unidad.message} />}
          </FormField>
        </div>

        <FormField id="param-nombre" label="Nombre" required>
          <TextInput id="param-nombre" {...register("nombre")} />
          {errors.nombre && <FieldError message={errors.nombre.message} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="param-min" label="Límite ECA mínimo">
            <TextInput id="param-min" type="number" step="any" {...register("limiteEcaMin")} />
          </FormField>
          <FormField id="param-max" label="Límite ECA máximo">
            <TextInput id="param-max" type="number" step="any" {...register("limiteEcaMax")} />
          </FormField>
        </div>

        <FormField id="param-desc" label="Descripción">
          <TextArea id="param-desc" {...register("descripcion")} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={resetAndClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">
            Guardar parámetro
          </button>
        </div>
      </form>
    </Modal>
  );
}
