"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextInput } from "@/components/ui/FormField";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  type AuditAction,
  type AuditEntityType,
  type AuditFilters,
} from "@/server/audit/audit.types";

interface AuditFiltersProps {
  filters: AuditFilters;
  onFilterChange: <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => void;
  onReset: () => void;
  onApply: () => void;
  responsables: { value: string; label: string }[];
}

const ALL = { value: "", label: "Todos" };

export function AuditFilters({
  filters,
  onFilterChange,
  onReset,
  onApply,
  responsables,
}: AuditFiltersProps) {
  const entityOptions = Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const actionOptions = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="audit-entity"
          label="Entidad"
          value={filters.entityType ?? ""}
          options={[ALL, ...entityOptions]}
          onChange={(v) => onFilterChange("entityType", v as AuditEntityType | undefined)}
        />
        <FilterSelect
          id="audit-action"
          label="Acción"
          value={filters.action ?? ""}
          options={[ALL, ...actionOptions]}
          onChange={(v) => onFilterChange("action", v as AuditAction | undefined)}
        />
        <FilterSelect
          id="audit-responsable"
          label="Responsable"
          value={filters.responsableId ?? ""}
          options={[ALL, ...responsables]}
          onChange={(v) => onFilterChange("responsableId", v || undefined)}
        />
        <FormField id="audit-search" label="Buscar">
          <TextInput
            id="audit-search"
            value={filters.search ?? ""}
            placeholder="ID, descripción…"
            onChange={(e) => onFilterChange("search", e.target.value || undefined)}
          />
        </FormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="audit-inicio" label="Fecha inicial">
          <TextInput
            id="audit-inicio"
            type="date"
            value={filters.fechaInicio ?? ""}
            onChange={(e) => onFilterChange("fechaInicio", e.target.value || undefined)}
          />
        </FormField>
        <FormField id="audit-fin" label="Fecha final">
          <TextInput
            id="audit-fin"
            type="date"
            value={filters.fechaFin ?? ""}
            onChange={(e) => onFilterChange("fechaFin", e.target.value || undefined)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 hover:text-cyan-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>
    </div>
  );
}
