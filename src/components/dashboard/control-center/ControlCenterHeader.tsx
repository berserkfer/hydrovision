"use client";

import { Droplets, UserCircle, Wifi } from "lucide-react";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDate } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";
import type { ExecutiveHeaderData } from "@/types/executive";
import { cn } from "@/lib/utils";

interface ControlCenterHeaderProps {
  data: ExecutiveHeaderData;
  evaluatedAt: string;
}

const QUALITY_BADGE: Record<ExecutiveHeaderData["qualityStatus"], string> = {
  optimo: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  aceptable: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  alerta: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critico: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function ControlCenterHeader({ data, evaluatedAt }: ControlCenterHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[var(--hv-header-border)] bg-[var(--hv-header-bg)] px-8 py-4 dark:bg-gradient-to-r dark:from-[#060e1a] dark:via-[#0b1424] dark:to-[#0a1628]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--hv-sidebar-active-bg)] ring-1 ring-[var(--hv-primary)]/30 dark:hv-glow-cyan">
            <Droplets className="h-5 w-5 text-[var(--hv-primary)]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--hv-primary)]">
              Centro de Control
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--hv-foreground)]">
              HydroVision
            </h1>
            <p className="mt-0.5 text-sm text-[var(--hv-foreground-muted)]">
              {data.watershedName} · {data.riverName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ThemeToggle />
          <span
            className={cn(
              "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
              QUALITY_BADGE[data.qualityStatus]
            )}
          >
            Calidad: {data.qualityStatusLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {data.riskEmoji} {data.riskLevelLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-3 py-1.5 text-xs text-[var(--hv-foreground-muted)]">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            Sistema operativo
          </span>
          <span className="inline-flex items-center rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-3 py-1.5 text-xs text-[var(--hv-foreground-muted)]">
            Último monitoreo: {formatDate(data.lastMonitoringDate)}
          </span>
          <span className="inline-flex items-center rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-3 py-1.5 text-xs text-[var(--hv-foreground-muted)]">
            Evaluado: {formatDate(evaluatedAt)}
          </span>
          <SimulatedDataIndicator />
          <div className="flex items-center gap-2 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-3 py-1.5">
            <UserCircle className="h-4 w-4 text-[var(--hv-foreground-dim)]" />
            <div className="text-left">
              <p className="text-xs font-medium text-[var(--hv-foreground)]">Fernando Chumpen</p>
              <p className="text-[10px] text-[var(--hv-foreground-dim)]">Investigador</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
        {SIMULATION_DISCLAIMER}
      </p>
    </header>
  );
}
