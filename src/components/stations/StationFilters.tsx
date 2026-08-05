"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import type { StationFilters } from "@/types/station-management";
import { STATION_STATUS_UI_LABELS } from "@/types/station-management";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { StationSearch } from "./StationSearch";

interface StationFiltersProps {
  filters: StationFilters;
  cuencaOptions: { value: string; label: string }[];
  rioOptions: { value: string; label: string }[];
  onFilterChange: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const ALL = { value: "", label: "Todas" };

export function StationFilters({
  filters,
  cuencaOptions,
  rioOptions,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: StationFiltersProps) {
  const estadoOptions = [
    ALL,
    { value: "active", label: STATION_STATUS_UI_LABELS.active },
    { value: "offline", label: STATION_STATUS_UI_LABELS.offline },
    { value: "maintenance", label: STATION_STATUS_UI_LABELS.maintenance },
  ];

  const ecaOptions = [
    ALL,
    { value: "compliant", label: getComplianceLabel("compliant") },
    { value: "alert", label: getComplianceLabel("alert") },
    { value: "non_compliant", label: getComplianceLabel("non_compliant") },
  ];

  return (
    <div className="space-y-4">
      <StationSearch value={filters.search} onChange={(v) => onFilterChange("search", v)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="filter-cuenca"
          label="Cuenca"
          value={filters.cuencaId}
          options={[ALL, ...cuencaOptions]}
          onChange={(v) => onFilterChange("cuencaId", v)}
        />
        <FilterSelect
          id="filter-rio"
          label="Río"
          value={filters.rioId}
          options={[ALL, ...rioOptions]}
          onChange={(v) => onFilterChange("rioId", v)}
        />
        <FilterSelect
          id="filter-estado"
          label="Estado"
          value={filters.estado}
          options={estadoOptions}
          onChange={(v) => onFilterChange("estado", v)}
        />
        <FilterSelect
          id="filter-eca"
          label="Clasificación ECA"
          value={filters.clasificacionEca}
          options={ecaOptions}
          onChange={(v) => onFilterChange("clasificacionEca", v)}
        />
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 transition-colors hover:text-cyan-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
