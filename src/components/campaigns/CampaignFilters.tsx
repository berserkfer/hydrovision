"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { EstadoCampana, ESTADO_CAMPANA_LABELS } from "@/constants/enums";
import {
  getCampaignMonthOptions,
  getCampaignYearOptions,
  getResponsablesOptions,
} from "@/lib/repositories/campaign.repository";
import type { CampaignFilters } from "@/types/campaign";
import { CAMPAIGN_FILTER_ALL } from "@/hooks/useCampaignFilters";

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onFilterChange: <K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const estadoOptions = [
  { value: CAMPAIGN_FILTER_ALL, label: "Todos los estados" },
  ...Object.values(EstadoCampana).map((estado) => ({
    value: estado,
    label: ESTADO_CAMPANA_LABELS[estado],
  })),
];

export function CampaignFilters({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: CampaignFiltersProps) {
  const yearOptions = [
    { value: CAMPAIGN_FILTER_ALL, label: "Todos los años" },
    ...getCampaignYearOptions(),
  ];

  const monthOptions = [
    { value: CAMPAIGN_FILTER_ALL, label: "Todos los meses" },
    ...getCampaignMonthOptions(),
  ];

  const responsableOptions = [
    { value: CAMPAIGN_FILTER_ALL, label: "Todos los responsables" },
    ...getResponsablesOptions(),
  ];

  return (
    <div className="space-y-4">
      <SearchInput
        id="campaign-search"
        value={filters.search}
        onChange={(v) => onFilterChange("search", v)}
        placeholder="Buscar por código, nombre, responsable u observaciones…"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="filter-year"
          label="Año"
          value={filters.year || CAMPAIGN_FILTER_ALL}
          options={yearOptions}
          onChange={(v) => onFilterChange("year", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-month"
          label="Mes"
          value={filters.month || CAMPAIGN_FILTER_ALL}
          options={monthOptions}
          onChange={(v) => onFilterChange("month", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-responsable"
          label="Responsable"
          value={filters.responsableId || CAMPAIGN_FILTER_ALL}
          options={responsableOptions}
          onChange={(v) => onFilterChange("responsableId", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-estado"
          label="Estado"
          value={filters.estado || CAMPAIGN_FILTER_ALL}
          options={estadoOptions}
          onChange={(v) => onFilterChange("estado", v === CAMPAIGN_FILTER_ALL ? "" : v)}
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
