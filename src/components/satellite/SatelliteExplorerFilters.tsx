"use client";

import { Search } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import type { UseSatelliteExplorerResult } from "@/hooks/useSatelliteExplorer";
import type { SatellitePlatform } from "@/services/satellite-explorer";
import { cn } from "@/lib/utils";

interface SatelliteExplorerFiltersProps {
  explorer: UseSatelliteExplorerResult;
}

export function SatelliteExplorerFilters({ explorer }: SatelliteExplorerFiltersProps) {
  const { query, filterOptions, isSearching, searchError, setQueryField, searchImages } =
    explorer;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Filtros de búsqueda</h3>
        <p className="mt-1 text-xs text-slate-500">
          Prepare la consulta Sentinel-2 para la cuenca de estudio (datos simulados).
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FilterSelect
          id="explorer-watershed"
          label="Cuenca"
          value={query.watershedId}
          options={filterOptions.watersheds}
          onChange={(value) => setQueryField("watershedId", value)}
        />
        <FilterSelect
          id="explorer-river"
          label="Río"
          value={query.riverId}
          options={filterOptions.rivers}
          onChange={(value) => setQueryField("riverId", value)}
        />
        <FilterSelect
          id="explorer-station"
          label="Punto de monitoreo"
          value={query.stationId}
          options={filterOptions.stations}
          onChange={(value) => setQueryField("stationId", value)}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="explorer-start" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Fecha inicial
          </label>
          <input
            id="explorer-start"
            type="date"
            value={query.startDate}
            onChange={(event) => setQueryField("startDate", event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="explorer-end" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Fecha final
          </label>
          <input
            id="explorer-end"
            type="date"
            value={query.endDate}
            onChange={(event) => setQueryField("endDate", event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>
        <FilterSelect
          id="explorer-satellite"
          label="Tipo de satélite"
          value={query.satellite}
          options={filterOptions.satellites.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
          onChange={(value) => setQueryField("satellite", value as SatellitePlatform)}
        />
      </div>

      {searchError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {searchError}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void searchImages()}
          disabled={isSearching}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white",
            "hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <Search className={cn("h-4 w-4", isSearching && "animate-pulse")} />
          {isSearching ? "Buscando…" : "Buscar imágenes"}
        </button>
      </div>
    </div>
  );
}
