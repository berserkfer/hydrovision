"use client";

import { InkFlow } from "@/components/ui/InkFlow";
import { DataTag } from "@/components/ui/DataTag";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";
import { DREN_4000_POINTS } from "@/data/mock/dren-4000-real-data";
import type { ExecutiveHeaderData } from "@/types/executive";

interface DashboardHeroProps {
  data: ExecutiveHeaderData;
  evaluatedAt: string;
}

const QUALITY_TONE: Record<ExecutiveHeaderData["qualityStatus"], string> = {
  optimo: "text-emerald-700 dark:text-emerald-300",
  aceptable: "text-[var(--hv-ink)]",
  alerta: "text-amber-700 dark:text-amber-300",
  critico: "text-red-700 dark:text-red-300",
};

const QUALITY_MARK: Record<ExecutiveHeaderData["qualityStatus"], string> = {
  optimo: "bg-emerald-500",
  aceptable: "bg-[var(--hv-ink)]",
  alerta: "bg-amber-500",
  critico: "bg-red-500",
};

const RISK_MARK: Record<string, string> = {
  bajo: "bg-emerald-500",
  moderado: "bg-amber-500",
  alto: "bg-orange-500",
  muy_alto: "bg-red-500",
  none: "bg-[var(--hv-foreground-dim)]",
};

function Readout({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 border-t border-[var(--hv-border)] pt-2.5", className)}>
      <p className="hv-eyebrow text-[9.5px]">{label}</p>
      <div className="mt-1 text-[13px] text-[var(--hv-foreground)]">{children}</div>
    </div>
  );
}

export function DashboardHero({ data, evaluatedAt }: DashboardHeroProps) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[var(--hv-border)]">
      {/* Celular: la corriente queda como franja superior tenue para no competir con el texto */}
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[150px] opacity-50 md:hidden"
        style={{
          maskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
        }}
      >
        <InkFlow seed={4000} density={0.5} outlet={{ x: 0.82, y: 0.32 }} />
      </div>
      <div
        className="absolute inset-y-0 right-0 -z-10 hidden w-[74%] md:block"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, transparent 8%, #000 50%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 8%, #000 50%)",
        }}
      >
        <InkFlow seed={4000} density={1.15} outlet={{ x: 0.7, y: 0.3 }} />
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-8 px-5 pb-8 pt-9 md:px-8 lg:px-12 lg:pt-12">
        <div className="min-w-0 max-w-[640px] flex-1">
          <p className="hv-eyebrow">Centro de control · {data.watershedName}</p>
          <h1 className="hv-display mt-4 text-[44px] sm:text-[58px] xl:text-[68px]">
            Cada gota, un dato.
            <br />
            Cada dato, su origen.
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-[var(--hv-foreground-muted)]">
            Calidad del agua del {data.riverName} con laboratorio, Sentinel-2 y fotos de celular.
            Cada número dice de dónde viene y cuánto se puede confiar en él.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {data.isSimulated ? (
              <DataTag tone="simulated">Datos simulados</DataTag>
            ) : (
              <span role="status" aria-label="Datos reales">
                <DataTag tone="real">Datos reales · Dren 4000</DataTag>
              </span>
            )}
            <DataTag tone="neutral">Sistema operativo</DataTag>
          </div>

          <dl className="mt-7 grid max-w-[480px] [text-shadow:0_0_6px_var(--hv-background),0_0_2px_var(--hv-background),0_0_1px_var(--hv-background)] grid-cols-2 gap-x-8 gap-y-4">
            <Readout label="Calidad ECA">
              <span className={cn("inline-flex items-center gap-1.5 font-medium", QUALITY_TONE[data.qualityStatus])}>
                <span className={cn("h-2 w-2 rounded-full", QUALITY_MARK[data.qualityStatus])} aria-hidden />
                {data.qualityStatusLabel}
              </span>
            </Readout>
            <Readout label="Riesgo">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span
                  className={cn("h-2 w-2 rounded-full", RISK_MARK[data.riskLevel ?? "none"] ?? "bg-[var(--hv-foreground-dim)]")}
                  aria-hidden
                />
                {data.riskLevelLabel}
              </span>
            </Readout>
            <Readout label="Último monitoreo">
              <span className="hv-num text-[11.5px] md:whitespace-nowrap">{formatDate(data.lastMonitoringDate)}</span>
            </Readout>
            <Readout label="Evaluado">
              <span className="hv-num text-[11.5px] md:whitespace-nowrap" suppressHydrationWarning>{formatDate(evaluatedAt)}</span>
            </Readout>
          </dl>
        </div>

        <aside
          aria-label="Ficha técnica"
          className="ml-auto hidden w-[176px] shrink-0 self-end border-l border-[var(--hv-border)] pl-5 xl:block"
        >
          <div className="space-y-3 py-1 [text-shadow:0_0_6px_var(--hv-background),0_0_2px_var(--hv-background),0_0_1px_var(--hv-background)]">
            <Readout label="Satélite" className="border-t-0 pt-0">
              Sentinel-2 L2A
            </Readout>
            <Readout label="Proveedor">
              Planetary Computer
              <span className="block text-[11px] text-[var(--hv-foreground-muted)]">
                respaldo: Copernicus Data Space
              </span>
            </Readout>
            <Readout label="Puntos reales">
              <span className="hv-num">{DREN_4000_POINTS.length}</span>
              <span className="text-[var(--hv-foreground-muted)]"> · 2014</span>
            </Readout>
            <Readout label="Fuente">Nizama y Cabrera (2018)</Readout>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 pb-6 md:px-8 lg:px-12">
        <p className="flex max-w-[900px] items-start gap-2.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-[12px] leading-relaxed text-[var(--hv-disclaimer-text)]">
          <span className="mt-[5px] h-2 w-2 shrink-0 rotate-45 bg-amber-500" aria-hidden />
          {SIMULATION_DISCLAIMER}
        </p>
      </div>
    </header>
  );
}
