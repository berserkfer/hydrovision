"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { FormField, TextInput } from "@/components/ui/FormField";
import {
  getReportFilterOptions,
  getRiosByCuencaForReport,
} from "@/lib/repositories/report.repository";
import type { ReportFilters } from "@/types/report-management";

interface ReportFiltersProps {
  filters: ReportFilters;
  onFilterChange: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  onReset: () => void;
  onGenerate: () => void;
  hasActiveFilters: boolean;
}

const ALL = { value: "", label: "Todos" };

export function ReportFilters({
  filters,
  onFilterChange,
  onReset,
  onGenerate,
  hasActiveFilters,
}: ReportFiltersProps) {
  const { cuencas, estaciones, campanas } = getReportFilterOptions();
  const rioOptions = filters.cuencaId
    ? getRiosByCuencaForReport(filters.cuencaId)
    : getReportFilterOptions().rios;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FilterSelect
          id="rep-cuenca"
          label="Cuenca"
          value={filters.cuencaId}
          options={[ALL, ...cuencas]}
          onChange={(v) => onFilterChange("cuencaId", v)}
        />
        <FilterSelect
          id="rep-rio"
          label="Río"
          value={filters.rioId}
          options={[ALL, ...rioOptions]}
          onChange={(v) => onFilterChange("rioId", v)}
          disabled={!filters.cuencaId && rioOptions.length > 4}
        />
        <FilterSelect
          id="rep-estacion"
          label="Estación"
          value={filters.estacionId}
          options={[ALL, ...estaciones]}
          onChange={(v) => onFilterChange("estacionId", v)}
        />
        <FilterSelect
          id="rep-campana"
          label="Campaña"
          value={filters.campanaId}
          options={[ALL, ...campanas]}
          onChange={(v) => onFilterChange("campanaId", v)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="rep-inicio" label="Fecha inicio">
          <TextInput
            id="rep-inicio"
            type="date"
            value={filters.fechaInicio}
            onChange={(e) => onFilterChange("fechaInicio", e.target.value)}
          />
        </FormField>
        <FormField id="rep-fin" label="Fecha fin">
          <TextInput
            id="rep-fin"
            type="date"
            value={filters.fechaFin}
            onChange={(e) => onFilterChange("fechaFin", e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
        >
          Generar vista previa
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
