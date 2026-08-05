"use client";

import { FilterSelect } from "@/components/map/filters/FilterSelect";
import type { GeospatialFilterOptions, GeospatialFilters } from "@/types/geospatial-center";

interface GeoFiltersProps {
  filters: GeospatialFilters;
  options: GeospatialFilterOptions;
  onFilterChange: <K extends keyof GeospatialFilters>(
    key: K,
    value: GeospatialFilters[K]
  ) => void;
  onReset: () => void;
  stationCount: number;
}

export function GeoFilters({
  filters,
  options,
  onFilterChange,
  onReset,
  stationCount,
}: GeoFiltersProps) {
  const withAll = (items: { value: string; label: string }[]) => [
    { value: "", label: "Todos" },
    ...items,
  ];

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="geo-search" className="mb-1 block text-xs font-medium text-slate-600">
          Buscar estación
        </label>
        <input
          id="geo-search"
          type="search"
          placeholder="Código, nombre, río o cuenca…"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FilterSelect
          id="geo-departamento"
          label="Departamento"
          value={filters.departamentoId}
          options={withAll(options.departamentos)}
          onChange={(v) => onFilterChange("departamentoId", v)}
        />
        <FilterSelect
          id="geo-cuenca"
          label="Cuenca"
          value={filters.cuencaId}
          options={withAll(options.cuencas)}
          onChange={(v) => onFilterChange("cuencaId", v)}
        />
        <FilterSelect
          id="geo-rio"
          label="Río"
          value={filters.rioId}
          options={withAll(options.rios)}
          onChange={(v) => onFilterChange("rioId", v)}
        />
        <FilterSelect
          id="geo-estado"
          label="Estado"
          value={filters.estado}
          options={withAll(options.estados)}
          onChange={(v) => onFilterChange("estado", v)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {stationCount} estación{stationCount !== 1 ? "es" : ""} visible
          {stationCount !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
