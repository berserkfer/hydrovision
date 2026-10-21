"use client";

import { RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { JobState } from "@/server/jobs/background-jobs";

interface JobStatusBarProps {
  state: JobState | null;
  computedAt: string | null;
  starting: boolean;
  onStart: () => void;
  /** Texto del botón (p. ej. "Recalcular"). */
  actionLabel?: string;
  canStart?: boolean;
}

/** Fecha del resultado guardado, estado del cálculo en segundo plano y botón para recalcular. */
export function JobStatusBar({
  state,
  computedAt,
  starting,
  onStart,
  actionLabel = "Recalcular en segundo plano",
  canStart = true,
}: JobStatusBarProps) {
  const runningNow = state?.status === "running";
  const progress = state?.progress;
  const percent =
    runningNow && progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] px-4 py-3">
      <div className="min-w-0 text-xs text-[var(--hv-foreground-muted)]" aria-live="polite">
        {computedAt ? (
          <span>
            Resultado guardado del <span className="hv-num text-[var(--hv-ink)]">{formatDate(computedAt)}</span>
          </span>
        ) : (
          <span>Aún no hay un resultado calculado.</span>
        )}
        {runningNow && (
          <span className="ml-2 inline-flex items-center gap-1.5 text-[var(--hv-ink)]">
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />
            Calculando{percent !== null ? ` · ${percent} %` : ""}
            {progress?.message ? ` · ${progress.message}` : ""}
          </span>
        )}
        {state?.status === "failed" && (
          <span className="ml-2 text-red-700">El último cálculo falló: {state.error}</span>
        )}
        {state?.status === "interrupted" && (
          <span className="ml-2 text-amber-800">El último cálculo se interrumpió (reinicio del servidor).</span>
        )}
      </div>
      {canStart && (
        <button
          type="button"
          onClick={onStart}
          disabled={runningNow || starting}
          className="inline-flex items-center gap-2 rounded-[3px] bg-[var(--hv-ink)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--hv-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
          {runningNow ? "En curso…" : actionLabel}
        </button>
      )}
    </div>
  );
}
