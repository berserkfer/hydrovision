"use client";

import { useCallback, useState } from "react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextArea, TextInput } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import {
  getCuencasOptions,
  getResponsablesOptions,
  getRiosByCuenca,
} from "@/lib/repositories/campaign.repository";
import type { CreateCampanaInput } from "@/types/campaign";

interface CampaignFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCampanaInput) => void;
}

interface FormState {
  nombre: string;
  responsableId: string;
  fecha: string;
  cuencaId: string;
  rioId: string;
  observaciones: string;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  responsableId: "",
  fecha: "",
  cuencaId: "",
  rioId: "",
  observaciones: "",
};

export function CampaignFormModal({ open, onClose, onSubmit }: CampaignFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const rioOptions = form.cuencaId
    ? [{ value: "", label: "Seleccionar río…" }, ...getRiosByCuenca(form.cuencaId)]
    : [{ value: "", label: "Seleccione una cuenca primero" }];

  const resetAndClose = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }, [onClose]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio";
    if (!form.responsableId) next.responsableId = "Seleccione un responsable";
    if (!form.fecha) next.fecha = "La fecha es obligatoria";
    if (!form.cuencaId) next.cuencaId = "Seleccione una cuenca";
    if (!form.rioId) next.rioId = "Seleccione un río";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      nombre: form.nombre,
      responsableId: form.responsableId,
      fecha: form.fecha,
      cuencaId: form.cuencaId,
      rioId: form.rioId,
      observaciones: form.observaciones,
    });

    resetAndClose();
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "cuencaId") next.rioId = "";
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Nueva Campaña"
      description="Registre una campaña de monitoreo ambiental. Los datos se guardan en memoria (simulado)."
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <FormField id="camp-nombre" label="Nombre" required>
          <TextInput
            id="camp-nombre"
            value={form.nombre}
            onChange={(e) => setField("nombre", e.target.value)}
            placeholder="Ej. Campaña Seca 2025 — Reque"
          />
          {errors.nombre && <FieldError message={errors.nombre} />}
        </FormField>

        <FormField id="camp-responsable" label="Responsable" required>
          <FilterSelect
            id="camp-responsable"
            label="Responsable"
            hideLabel
            value={form.responsableId}
            options={[{ value: "", label: "Seleccionar responsable…" }, ...getResponsablesOptions()]}
            onChange={(v) => setField("responsableId", v)}
          />
          {errors.responsableId && <FieldError message={errors.responsableId} />}
        </FormField>

        <FormField id="camp-fecha" label="Fecha de inicio" required>
          <TextInput
            id="camp-fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setField("fecha", e.target.value)}
          />
          {errors.fecha && <FieldError message={errors.fecha} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="camp-cuenca" label="Cuenca" required>
            <FilterSelect
              id="camp-cuenca"
              label="Cuenca"
              hideLabel
              value={form.cuencaId}
              options={[{ value: "", label: "Seleccionar cuenca…" }, ...getCuencasOptions()]}
              onChange={(v) => setField("cuencaId", v)}
            />
            {errors.cuencaId && <FieldError message={errors.cuencaId} />}
          </FormField>

          <FormField id="camp-rio" label="Río" required>
            <FilterSelect
              id="camp-rio"
              label="Río"
              hideLabel
              value={form.rioId}
              options={rioOptions}
              onChange={(v) => setField("rioId", v)}
              disabled={!form.cuencaId}
            />
            {errors.rioId && <FieldError message={errors.rioId} />}
          </FormField>
        </div>

        <FormField id="camp-obs" label="Observaciones">
          <TextArea
            id="camp-obs"
            value={form.observaciones}
            onChange={(e) => setField("observaciones", e.target.value)}
            placeholder="Objetivo, alcance o notas de la campaña…"
          />
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
