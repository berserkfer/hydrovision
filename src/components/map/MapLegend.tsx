import { COMPLIANCE_LEGEND_ITEMS } from "./map-config";

interface MapLegendProps {
  className?: string;
}

/**
 * Leyenda flotante que explica el código de colores ECA en el mapa.
 */
export function MapLegend({ className = "" }: MapLegendProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm ${className}`}
      role="note"
      aria-label="Leyenda de estados ECA"
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Estado ECA
      </p>
      <ul className="space-y-1">
        {COMPLIANCE_LEGEND_ITEMS.map(({ status, label, color }) => (
          <li key={status} className="flex items-center gap-2 text-xs text-slate-700">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
              style={{ backgroundColor: color }}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
