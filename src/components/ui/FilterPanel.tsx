"use client";

import { cn } from "@/lib/utils";

interface FilterPanelProps {
  children: React.ReactNode;
  className?: string;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterPanel({
  children,
  className,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">Filtros</h3>
        {onReset && hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}
