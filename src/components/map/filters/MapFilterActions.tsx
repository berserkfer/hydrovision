import { RotateCcw, Crosshair } from "lucide-react";

interface MapFilterActionsProps {
  onReset: () => void;
  onRecenter: () => void;
}

/**
 * Acciones del panel de control con feedback visual al hover y click.
 */
export function MapFilterActions({ onReset, onRecenter }: MapFilterActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/40 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-100 shadow-sm transition-all duration-200 hover:border-slate-400/60 hover:bg-slate-600/60 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
      >
        <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-90" aria-hidden="true" />
        Restablecer filtros
      </button>
      <button
        type="button"
        onClick={onRecenter}
        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-cyan-500 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
      >
        <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
        Centrar mapa
      </button>
    </div>
  );
}
