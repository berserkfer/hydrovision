"use client";

import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { TEMPORAL_PARAMETERS } from "@/services/temporal";
import type { TemporalAnalysisFilters } from "@/types/temporal";
import type { TemporalStationOption } from "@/repositories/temporal.repository";
import { RotateCcw } from "lucide-react";

interface TemporalFiltersBarProps {
  stations: TemporalStationOption[];
  filters: TemporalAnalysisFilters;
  onFilterChange: <K extends keyof TemporalAnalysisFilters>(
    key: K,
    value: TemporalAnalysisFilters[K]
  ) => void;
  onReset: () => void;
}

export function TemporalFiltersBar({
  stations,
  filters,
  onFilterChange,
  onReset,
}: TemporalFiltersBarProps) {
  const stationOptions = stations.map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name}`,
  }));

  const parameterOptions = TEMPORAL_PARAMETERS.map((p) => ({
    value: p.key,
    label: p.label,
  }));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="temporal-station"
          label="Estación"
          value={filters.stationId}
          options={stationOptions}
          onChange={(value) => onFilterChange("stationId", value)}
        />
        <FilterSelect
          id="temporal-parameter"
          label="Parámetro"
          value={filters.parameter}
          options={parameterOptions}
          onChange={(value) =>
            onFilterChange("parameter", value as TemporalAnalysisFilters["parameter"])
          }
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="temporal-start"
            className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            Fecha inicio
          </label>
          <input
            id="temporal-start"
            type="date"
            value={filters.startDate}
            max={filters.endDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="temporal-end"
            className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            Fecha fin
          </label>
          <input
            id="temporal-end"
            type="date"
            value={filters.endDate}
            min={filters.startDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
      >
        <RotateCcw className="h-4 w-4" />
        Restablecer
      </button>
    </div>
  );
}
