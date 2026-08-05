import type { EnvironmentalGeneralStatus } from "@/types/environmental-evaluation";
import { SEMAPHORE_LABELS } from "@/types/environmental-evaluation";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EnvironmentalStatusCardProps {
  status: EnvironmentalGeneralStatus;
}

const SEMAPHORE_STYLES = {
  green: {
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-700",
  },
  yellow: {
    ring: "ring-amber-500/30",
    bg: "bg-amber-500",
    glow: "shadow-amber-500/20",
    text: "text-amber-700",
  },
  red: {
    ring: "ring-red-500/30",
    bg: "bg-red-500",
    glow: "shadow-red-500/20",
    text: "text-red-700",
  },
};

export function EnvironmentalStatusCard({ status }: EnvironmentalStatusCardProps) {
  const styles = SEMAPHORE_STYLES[status.semaforo];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Estado General</h3>
      </div>
      <div className="flex flex-wrap items-center gap-8 p-6">
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full ring-4 shadow-lg",
              styles.ring,
              styles.bg,
              styles.glow
            )}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {SEMAPHORE_LABELS[status.semaforo]}
            </span>
          </div>
          <p className="text-[10px] font-medium uppercase text-slate-400">Semáforo ambiental</p>
        </div>

        <div className="min-w-[200px] flex-1 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Estado ambiental general
            </p>
            <p className={cn("mt-1 text-lg font-bold", styles.text)}>{status.estadoGeneral}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Nivel de riesgo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{status.nivelRiesgoLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Fecha de evaluación
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(status.fechaEvaluacion)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
