"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { DataTag } from "@/components/ui/DataTag";
import { JobStatusBar } from "@/components/ui/JobStatusBar";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { cn } from "@/lib/utils";
import type {
  PixelReviewReport,
  PixelReviewRow,
  PixelReviewStatus,
} from "@/server/satellite/pixel-review.service";

type Filter = "attention" | "adjusted" | "blocked" | "all";

const BLOCKED: PixelReviewStatus[] = [
  "blocked_no_water_in_radius",
  "blocked_insufficient_water",
  "discarded_clouds",
  "no_data",
];

const FILTERS: Array<{ value: Filter; label: string; match: (r: PixelReviewRow) => boolean }> = [
  { value: "attention", label: "Para revisar", match: (r) => r.status === "adjusted" || BLOCKED.includes(r.status) },
  { value: "adjusted", label: "Ajustados", match: (r) => r.status === "adjusted" },
  { value: "blocked", label: "Bloqueados / descartados", match: (r) => BLOCKED.includes(r.status) },
  { value: "all", label: "Todos", match: () => true },
];

const STATUS_STYLE: Record<PixelReviewStatus, string> = {
  center_water: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/35",
  adjusted: "bg-amber-500/12 text-amber-800 ring-amber-500/40",
  blocked_no_water_in_radius: "bg-red-500/10 text-red-700 ring-red-500/35",
  blocked_insufficient_water: "bg-red-500/10 text-red-700 ring-red-500/35",
  discarded_clouds: "bg-slate-500/10 text-slate-700 ring-slate-500/35",
  no_data: "bg-slate-500/10 text-slate-600 ring-slate-500/30",
  not_evaluated: "bg-slate-500/10 text-slate-600 ring-slate-500/30",
};

function coord(lat: number | null, lon: number | null): string {
  return lat === null || lon === null ? "—" : `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export function PixelReviewView() {
  const job = useBackgroundJob<PixelReviewReport>("/api/satellite/pixel-review");
  const report = job.latest?.result ?? null;
  const error = job.error;
  const [filter, setFilter] = useState<Filter>("attention");

  const active = FILTERS.find((f) => f.value === filter)!;
  const rows = useMemo(() => (report ? report.rows.filter(active.match) : []), [report, active]);
  const attention = report ? report.rows.filter(FILTERS[0].match).length : 0;

  return (
    <MainLayout>
      <MonitoringHeader
        title="Revisión de píxeles de agua"
        subtitle="Puntos cuyo píxel Sentinel-2 se ajustó, bloqueó o descartó. Revíselos antes de calibrar."
        origin={
          <>
            <DataTag tone="real">Escenas Sentinel-2 reales · últimos 90 días</DataTag>
            <DataTag tone="neutral">
              Radio de ajuste {report?.searchRadiusM ?? 30} m · cauce ={" "}
              {report?.channel?.source === "channel_polygon"
                ? `polígono subido (${report.channel.name})`
                : "cuerpo de agua conexo"}
            </DataTag>
          </>
        }
        showDisclaimer={false}
      />
      <PageContent>
        <div className="mx-auto max-w-[1600px] space-y-6">
          <JobStatusBar
            state={job.state}
            computedAt={job.latest?.computedAt ?? null}
            starting={job.starting}
            onStart={() => void job.start({ days: 90 })}
          />
          {!report && !error && job.state?.status !== "running" && (
            <p className="text-sm text-[var(--hv-foreground-muted)]">
              Todavía no hay una revisión guardada. Lance el cálculo: recorre los 10 puntos y sus escenas
              recientes en segundo plano (puede tardar varios minutos) y queda guardado.
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-[3px] border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {report && (
            <>
              <section className="grid overflow-hidden rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] sm:grid-cols-3 xl:grid-cols-6">
                {(
                  [
                    ["center_water", "Píxel del punto"],
                    ["adjusted", "Ajustados"],
                    ["blocked_no_water_in_radius", "Sin agua en radio"],
                    ["blocked_insufficient_water", "f_agua insuficiente"],
                    ["discarded_clouds", "Nubes"],
                    ["no_data", "Sin datos"],
                  ] as Array<[PixelReviewStatus, string]>
                ).map(([status, label], i) => (
                  <div key={status} className={cn("p-4", i > 0 && "border-t border-[var(--hv-border)] sm:border-l sm:border-t-0")}>
                    <p className="hv-eyebrow text-[9.5px]">{label}</p>
                    <p className="mt-2 text-[30px] font-light leading-none tabular-nums text-[var(--hv-ink)]">
                      {report.summary[status]}
                    </p>
                  </div>
                ))}
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Filtrar" className="flex flex-wrap gap-2 text-xs">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      role="tab"
                      aria-selected={filter === f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "rounded-[3px] px-2.5 py-1 ring-1 ring-inset",
                        filter === f.value
                          ? "bg-[var(--hv-ink)] text-[var(--hv-primary-foreground)] ring-[var(--hv-ink)]"
                          : "text-slate-600 ring-slate-300 hover:ring-[var(--hv-ink)]/40"
                      )}
                    >
                      {f.label}
                      {f.value === "attention" ? ` (${attention})` : ""}
                    </button>
                  ))}
                </div>
                <a
                  href="/api/satellite/pixel-review?format=csv"
                  className="inline-flex items-center gap-2 rounded-[3px] border border-[var(--hv-ink)]/30 px-3 py-1.5 text-xs font-medium text-[var(--hv-ink)] hover:bg-[var(--hv-ink-wash)]"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                  Descargar CSV
                </a>
              </div>

              <section className="overflow-x-auto rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)]">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-[var(--hv-border)] text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]">
                    <tr>
                      <th className="px-4 py-2">Punto</th>
                      <th className="px-4 py-2">Escena</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Coordenada original</th>
                      <th className="px-4 py-2">Coordenada usada</th>
                      <th className="px-4 py-2">Ajuste</th>
                      <th className="px-4 py-2">f_agua</th>
                      <th className="px-4 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-[var(--hv-foreground-muted)]">
                          No hay escenas en este filtro.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={`${r.stationId}-${r.sceneId}`} className="align-top">
                          <td className="px-4 py-3">
                            <span className="font-medium text-[var(--hv-ink)]">{r.codigo}</span>
                            <span className="block max-w-[220px] text-xs text-[var(--hv-foreground-muted)]">{r.nombre}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="hv-num block whitespace-nowrap text-[12px]">{r.acquisitionDate}</span>
                            <span className="text-[11px] text-[var(--hv-foreground-dim)]">
                              {r.provider} · nubes {r.cloudPercentage === null ? "?" : `${Math.round(r.cloudPercentage)} %`}
                              {r.cloudMode ? ` · regla ${r.cloudMode === "relaxed" ? "relajada" : "estricta"}` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex whitespace-nowrap rounded-[3px] px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLE[r.status])}>
                              {r.statusLabel}
                            </span>
                          </td>
                          <td className="hv-num px-4 py-3 text-[11.5px]">{coord(r.originalLatitude, r.originalLongitude)}</td>
                          <td className="hv-num px-4 py-3 text-[11.5px]">{coord(r.adjustedLatitude, r.adjustedLongitude)}</td>
                          <td className="hv-num px-4 py-3 text-[12px]">
                            {r.adjustmentDistanceM === null ? "—" : `${r.adjustmentDistanceM} m`}
                          </td>
                          <td className="hv-num px-4 py-3 text-[12px]">
                            {r.waterFraction === null ? "—" : r.waterFraction.toFixed(2)}
                            {r.waterPixels !== null && (
                              <span className="block text-[10.5px] text-[var(--hv-foreground-dim)]">
                                {r.waterPixels}/{r.validPixels} agua
                              </span>
                            )}
                          </td>
                          <td className="max-w-[360px] px-4 py-3 text-xs leading-relaxed text-[var(--hv-foreground-muted)]">
                            {r.reason}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>

              {report.stationsWithoutScenes.length > 0 && (
                <section className="rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] p-4">
                  <p className="hv-eyebrow text-[9.5px]">Puntos sin escenas para revisar</p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--hv-foreground-muted)]">
                    {report.stationsWithoutScenes.map((s) => (
                      <li key={s.stationId}>
                        <span className="font-medium text-[var(--hv-ink)]">{s.codigo}</span> — {s.reason}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="flex max-w-[900px] items-start gap-2.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
                <span className="mt-[5px] h-2 w-2 shrink-0 rotate-45 bg-amber-500" aria-hidden />
                {report.note}
              </p>
            </>
          )}
        </div>
      </PageContent>
    </MainLayout>
  );
}
