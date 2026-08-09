"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextInput } from "@/components/ui/FormField";
import type { ExportFilterOptions, ExportReportFilters } from "@/server/reports/report.types";

interface ReportFiltersProps {
  filters: ExportReportFilters;
  options: ExportFilterOptions;
  onFilterChange: <K extends keyof ExportReportFilters>(key: K, value: ExportReportFilters[K]) => void;
  onReset: () => void;
  onPreview: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
}

const ALL = { value: "", label: "Todos" };

export function ReportFilters({
  filters,
  options,
  onFilterChange,
  onReset,
  onPreview,
  hasActiveFilters,
  loading,
}: ReportFiltersProps) {
  const rioOptions = filters.cuencaId
    ? options.rios
    : options.rios;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FilterSelect
          id="exp-cuenca"
          label="Cuenca"
          value={filters.cuencaId}
          options={[ALL, ...options.cuencas]}
          onChange={(v) => onFilterChange("cuencaId", v)}
        />
        <FilterSelect
          id="exp-rio"
          label="Río"
          value={filters.rioId}
          options={[ALL, ...rioOptions]}
          onChange={(v) => onFilterChange("rioId", v)}
        />
        <FilterSelect
          id="exp-estacion"
          label="Estación"
          value={filters.estacionId}
          options={[ALL, ...options.estaciones]}
          onChange={(v) => onFilterChange("estacionId", v)}
        />
        <FilterSelect
          id="exp-campana"
          label="Campaña"
          value={filters.campanaId}
          options={[ALL, ...options.campanas]}
          onChange={(v) => onFilterChange("campanaId", v)}
        />
        <FilterSelect
          id="exp-parametro"
          label="Parámetro"
          value={filters.parametroCodigo}
          options={[ALL, ...options.parametros.map((p) => ({ value: p.value, label: p.label }))]}
          onChange={(v) => onFilterChange("parametroCodigo", v)}
        />
        <FilterSelect
          id="exp-categoria"
          label="Categoría"
          value={filters.categoria}
          options={[ALL, ...options.categorias]}
          onChange={(v) => onFilterChange("categoria", v)}
        />
        <FilterSelect
          id="exp-estado"
          label="Estado ambiental"
          value={filters.estadoAmbiental}
          options={[ALL, ...options.estadosAmbientales]}
          onChange={(v) => onFilterChange("estadoAmbiental", v)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="exp-inicio" label="Fecha inicial">
          <TextInput
            id="exp-inicio"
            type="date"
            value={filters.fechaInicio}
            onChange={(e) => onFilterChange("fechaInicio", e.target.value)}
          />
        </FormField>
        <FormField id="exp-fin" label="Fecha final">
          <TextInput
            id="exp-fin"
            type="date"
            value={filters.fechaFin}
            onChange={(e) => onFilterChange("fechaFin", e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? "Calculando…" : "Vista previa"}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 hover:text-cyan-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
