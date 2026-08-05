"use client";

import { ArrowUpDown, LayoutGrid, RotateCcw, Search } from "lucide-react";
import { IndicatorCard } from "@/components/indicators/IndicatorCard";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import type { Indicator, IndicatorCategoryMeta, IndicatorQueryOptions } from "@/types/indicators";
import { INDICATOR_SCORE_LABELS } from "@/types/indicators";
import { cn } from "@/lib/utils";

interface IndicatorsToolbarProps {
  query: IndicatorQueryOptions;
  categories: IndicatorCategoryMeta[];
  totalCount: number;
  averageScore: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: IndicatorQueryOptions["category"]) => void;
  onStatusChange: (value: IndicatorQueryOptions["status"]) => void;
  onSortByChange: (value: IndicatorQueryOptions["sortBy"]) => void;
  onToggleSortOrder: () => void;
  onToggleGroup: () => void;
  onReset: () => void;
}

export function IndicatorsToolbar({
  query,
  categories,
  totalCount,
  averageScore,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortByChange,
  onToggleSortOrder,
  onToggleGroup,
  onReset,
}: IndicatorsToolbarProps) {
  const categoryOptions = [
    { value: "all", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: c.key, label: c.label })),
  ];

  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    ...Object.entries(INDICATOR_SCORE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const sortOptions = [
    { value: "score", label: "Puntuación" },
    { value: "name", label: "Nombre" },
    { value: "importance", label: "Importancia" },
    { value: "category", label: "Categoría" },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hv-animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Centro de Indicadores Ambientales</h2>
          <p className="text-xs text-slate-500">
            {totalCount} indicador(es) · Promedio {averageScore}/100
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restablecer
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar indicador…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>
        <FilterSelect
          id="ind-category"
          label="Categoría"
          value={query.category}
          options={categoryOptions}
          onChange={(v) => onCategoryChange(v as IndicatorQueryOptions["category"])}
        />
        <FilterSelect
          id="ind-status"
          label="Estado"
          value={query.status}
          options={statusOptions}
          onChange={(v) => onStatusChange(v as IndicatorQueryOptions["status"])}
        />
        <FilterSelect
          id="ind-sort"
          label="Ordenar"
          value={query.sortBy}
          options={sortOptions}
          onChange={(v) => onSortByChange(v as IndicatorQueryOptions["sortBy"])}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleSortOrder}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {query.sortOrder === "asc" ? "Ascendente" : "Descendente"}
        </button>
        <button
          type="button"
          onClick={onToggleGroup}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            query.groupByCategory
              ? "border-cyan-300 bg-cyan-50 text-cyan-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Agrupar por categoría
        </button>
      </div>
    </div>
  );
}

interface IndicatorsGridProps {
  indicators: Indicator[];
  groupLabel?: string;
}

export function IndicatorsGrid({ indicators, groupLabel }: IndicatorsGridProps) {
  if (indicators.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
        No se encontraron indicadores con los filtros aplicados.
      </p>
    );
  }

  return (
    <div className="space-y-3 hv-animate-fade-in">
      {groupLabel && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{groupLabel}</h3>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {indicators.map((ind) => (
          <IndicatorCard key={ind.id} indicator={ind} />
        ))}
      </div>
    </div>
  );
}
