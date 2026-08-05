"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { PARAMETER_CATEGORY_LABELS } from "@/lib/parameters/catalog";
import { getComplianceLabel } from "@/lib/eca/classifier";
import type { ParameterFilters } from "@/types/parameter-management";

interface ParameterFiltersProps {
  filters: ParameterFilters;
  estacionOptions: { value: string; label: string }[];
  campanaOptions: { value: string; label: string }[];
  fechaOptions: string[];
  onFilterChange: <K extends keyof ParameterFilters>(key: K, value: ParameterFilters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const ALL = { value: "", label: "Todos" };

export function ParameterFilters({
  filters,
  estacionOptions,
  campanaOptions,
  fechaOptions,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: ParameterFiltersProps) {
  const categoryOptions = [
    ALL,
    ...Object.entries(PARAMETER_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const statusOptions = [
    ALL,
    { value: "compliant", label: getComplianceLabel("compliant") },
    { value: "alert", label: getComplianceLabel("alert") },
    { value: "non_compliant", label: getComplianceLabel("non_compliant") },
  ];

  const fechaSelectOptions = [
    ALL,
    ...fechaOptions.map((f) => ({ value: f, label: f })),
  ];

  return (
    <div className="space-y-4">
      <SearchInput
        id="parameter-search"
        value={filters.search}
        onChange={(v) => onFilterChange("search", v)}
        placeholder="Buscar parámetro, estación, campaña o categoría…"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          id="filter-estacion"
          label="Estación"
          value={filters.estacionId}
          options={[ALL, ...estacionOptions]}
          onChange={(v) => onFilterChange("estacionId", v)}
        />
        <FilterSelect
          id="filter-campana"
          label="Campaña"
          value={filters.campanaId}
          options={[ALL, ...campanaOptions]}
          onChange={(v) => onFilterChange("campanaId", v)}
        />
        <FilterSelect
          id="filter-category"
          label="Categoría"
          value={filters.category}
          options={categoryOptions}
          onChange={(v) => onFilterChange("category", v)}
        />
        <FilterSelect
          id="filter-status"
          label="Estado"
          value={filters.status}
          options={statusOptions}
          onChange={(v) => onFilterChange("status", v)}
        />
        <FilterSelect
          id="filter-fecha"
          label="Fecha"
          value={filters.fecha}
          options={fechaSelectOptions}
          onChange={(v) => onFilterChange("fecha", v)}
        />
      </div>
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
  );
}
