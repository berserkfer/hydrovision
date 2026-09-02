"use client";

import { Droplets } from "lucide-react";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { formatDate } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";
import type { ExecutiveHeaderData } from "@/types/executive";
import { cn } from "@/lib/utils";

interface ExecutiveHeaderProps {
  data: ExecutiveHeaderData;
}

const QUALITY_COLORS = {
  optimo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  aceptable: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  alerta: "bg-amber-50 text-amber-700 ring-amber-200",
  critico: "bg-red-50 text-red-700 ring-red-200",
};

export function ExecutiveHeader({ data }: ExecutiveHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400/80">
                Dashboard Ejecutivo
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{data.projectName}</h1>
              <p className="mt-1 text-sm text-slate-300">
                {data.watershedName} · {data.riverName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
                QUALITY_COLORS[data.qualityStatus]
              )}
            >
              Calidad: {data.qualityStatusLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20">
              {data.riskEmoji} {data.riskLevelLabel}
            </span>
            <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/20">
              Último monitoreo: {formatDate(data.lastMonitoringDate)}
            </span>
            <SimulatedDataIndicator />
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          {SIMULATION_DISCLAIMER}
        </p>
      </div>
    </header>
  );
}
