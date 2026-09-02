"use client";

import { Layers } from "lucide-react";
import type { MapFilterField, MapFilterState } from "@/types/geography";
import { getFilterOptions } from "@/lib/map/filter-utils";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { FilterSelect } from "./FilterSelect";
import { MapFilterActions } from "./MapFilterActions";

const FILTER_FIELDS: { field: MapFilterField; label: string }[] = [
  { field: "departmentId", label: "Departamento" },
  { field: "provinceId", label: "Provincia" },
  { field: "districtId", label: "Distrito" },
  { field: "watershedId", label: "Cuenca hidrográfica" },
  { field: "riverId", label: "Río" },
  { field: "stationId", label: "Estación de monitoreo" },
];

interface MapControlPanelProps {
  filters: MapFilterState;
  onFilterChange: (field: MapFilterField, value: string) => void;
  onReset: () => void;
  onRecenter: () => void;
}

/**
 * Panel de control estilo ArcGIS Dashboard.
 * Barra superior oscura, filtros en grid responsive y acciones rápidas.
 */
export function MapControlPanel({
  filters,
  onFilterChange,
  onReset,
  onRecenter,
}: MapControlPanelProps) {
  return (
    <div className="hv-animate-fade-in overflow-hidden rounded-lg border border-slate-300/70 bg-white shadow-lg ring-1 ring-slate-900/5 transition-shadow duration-300 hover:shadow-xl">
      {/* Cabecera tipo ArcGIS */}
      <div className="flex flex-col gap-3 border-b border-slate-700/20 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/20">
            <Layers className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Panel de control</p>
            <p className="text-[11px] text-slate-400">Filtros geográficos del monitoreo</p>
          </div>
            <SimulatedDataIndicator />
        </div>
        <MapFilterActions onReset={onReset} onRecenter={onRecenter} />
      </div>

      {/* Cuadrícula de filtros */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {FILTER_FIELDS.map(({ field, label }, index) => (
          <FilterSelect
            key={field}
            id={`map-filter-${field}`}
            label={label}
            value={filters[field]}
            options={getFilterOptions(filters, field)}
            onChange={(value) => onFilterChange(field, value)}
            className="hv-animate-fade-in"
            style={{ animationDelay: `${index * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
