"use client";

import type { SatelliteMetadata } from "@/services/satellite-explorer";
import { cn } from "@/lib/utils";

interface SatelliteInfoPanelProps {
  metadata: SatelliteMetadata | undefined;
  className?: string;
}

export function SatelliteInfoPanel({ metadata, className }: SatelliteInfoPanelProps) {
  if (!metadata) {
    return (
      <aside
        className={cn(
          "rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500",
          className
        )}
      >
        Seleccione un satélite para ver metadatos.
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Información del satélite
        </p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">{metadata.displayName}</h3>
        <p className="text-xs text-slate-500">{metadata.provider}</p>
      </div>

      <dl className="space-y-3 px-4 py-4 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-500">Resolución espacial</dt>
          <dd className="mt-0.5 font-medium text-slate-800">{metadata.spatialResolutionMeters} m/píxel</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-500">Resolución temporal</dt>
          <dd className="mt-0.5 font-medium text-slate-800">~{metadata.temporalResolutionDays} días</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-500">Colección GEE</dt>
          <dd className="mt-0.5 break-all font-mono text-[11px] text-slate-700">
            {metadata.collectionId}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-500">Bandas disponibles</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {metadata.bands.map((band) => (
              <span
                key={band}
                className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700"
              >
                {band}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase text-slate-500">
            Índices calculables
          </dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {metadata.calculableIndices.map((index) => (
              <span
                key={index}
                className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700"
              >
                {index}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
