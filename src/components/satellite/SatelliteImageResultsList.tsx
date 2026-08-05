"use client";

import type { SatelliteImage } from "@/services/satellite-explorer";
import { formatDisplayDate, formatStatusLabel } from "@/services/satellite-explorer";
import { cn } from "@/lib/utils";

interface SatelliteImageResultsListProps {
  images: SatelliteImage[];
  isSearching: boolean;
}

const STATUS_STYLES: Record<SatelliteImage["status"], string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  cloudy: "bg-slate-100 text-slate-600 ring-slate-200",
  unavailable: "bg-red-50 text-red-700 ring-red-200",
};

export function SatelliteImageResultsList({ images, isSearching }: SatelliteImageResultsListProps) {
  if (isSearching) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Generando catálogo simulado Sentinel-2…
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Configure los filtros y pulse <strong>Buscar imágenes</strong> para ver resultados simulados.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Resultados simulados ({images.length})
        </h3>
        <p className="text-xs text-slate-500">Preparado para reemplazar por catálogo GEE real.</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {images.map((image) => (
          <li key={image.id} className="flex gap-4 px-4 py-3">
            <img
              src={image.thumbnailUrl}
              alt={`Miniatura ${image.id}`}
              className="h-16 w-20 shrink-0 rounded-md border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {formatDisplayDate(image.acquiredAt)}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                    STATUS_STYLES[image.status]
                  )}
                >
                  {formatStatusLabel(image.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Satélite: <span className="font-medium uppercase">{image.platform}</span>
              </p>
              <p className="text-xs text-slate-500">
                Cobertura de nubes: {image.cloudCoverPercent}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
