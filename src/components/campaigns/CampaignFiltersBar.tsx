"use client";

import { RotateCcw } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { EstadoCampana, ESTADO_CAMPANA_LABELS } from "@/constants/enums";
import {
  getCuencasOptions,
  getResponsablesOptions,
} from "@/lib/repositories/campaign.repository";
import type { CampaignFilters } from "@/types/campaign";
import { CAMPAIGN_FILTER_ALL } from "@/hooks/useCampaignFilters";

interface CampaignFiltersBarProps {
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

const fechaOptions = [
  { value: CAMPAIGN_FILTER_ALL, label: "Todas las fechas" },
  { value: "2025-01", label: "Ene 2025" },
  { value: "2025-02", label: "Feb 2025" },
  { value: "2025-05", label: "May 2025" },
  { value: "2025-06", label: "Jun 2025" },
  { value: "2025-07", label: "Jul 2025" },
];

export function CampaignFiltersBar({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: CampaignFiltersBarProps) {
  const responsableOptions = [
    { value: CAMPAIGN_FILTER_ALL, label: "Todos los responsables" },
    ...getResponsablesOptions(),
  ];

  const cuencaOptions = [
    { value: CAMPAIGN_FILTER_ALL, label: "Todas las cuencas" },
    ...getCuencasOptions(),
  ];

  return (
    <div className="space-y-4">
      <SearchInput
        id="campaign-search"
        value={filters.search}
        onChange={(v) => onFilterChange("search", v)}
        placeholder="Buscar por código, nombre, responsable, río o cuenca…"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <FilterSelect
          id="filter-fecha"
          label="Fecha"
          value={filters.fecha || CAMPAIGN_FILTER_ALL}
          options={fechaOptions}
          onChange={(v) => onFilterChange("fecha", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-responsable"
          label="Responsable"
          value={filters.responsableId || CAMPAIGN_FILTER_ALL}
          options={responsableOptions}
          onChange={(v) => onFilterChange("responsableId", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-cuenca"
          label="Cuenca"
          value={filters.cuencaId || CAMPAIGN_FILTER_ALL}
          options={cuencaOptions}
          onChange={(v) => onFilterChange("cuencaId", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />
        <FilterSelect
          id="filter-estado"
          label="Estado"
          value={filters.estado || CAMPAIGN_FILTER_ALL}
          options={estadoOptions}
          onChange={(v) => onFilterChange("estado", v === CAMPAIGN_FILTER_ALL ? "" : v)}
        />

        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
