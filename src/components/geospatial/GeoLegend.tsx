import type { GeoStationStatus } from "@/types/geospatial-center";
import { GEO_LEGEND_ITEMS } from "@/types/geospatial-center";

interface GeoLegendProps {
  className?: string;
}

export function GeoLegend({ className = "" }: GeoLegendProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm ${className}`}
      aria-label="Leyenda de estados ambientales"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Estado ambiental
      </p>
      <ul className="space-y-1.5">
        {GEO_LEGEND_ITEMS.map((item) => (
          <li key={item.status} className="flex items-center gap-2 text-xs text-slate-700">
            <span aria-hidden>{item.emoji}</span>
            <LegendSwatch status={item.status} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendSwatch({ status }: { status: GeoStationStatus }) {
  const colors: Record<GeoStationStatus, string> = {
    good: "bg-emerald-500",
    alert: "bg-amber-500",
    critical: "bg-red-500",
    unknown: "bg-slate-400",
  };

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}
