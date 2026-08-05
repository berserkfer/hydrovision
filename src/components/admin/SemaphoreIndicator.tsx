"use client";

import { cn } from "@/lib/utils";

export type SemaphoreStatus = "green" | "yellow" | "red";

const STATUS_STYLES: Record<SemaphoreStatus, string> = {
  green: "bg-emerald-500 shadow-emerald-500/40",
  yellow: "bg-amber-400 shadow-amber-400/40",
  red: "bg-red-500 shadow-red-500/40",
};

const STATUS_LABELS: Record<SemaphoreStatus, string> = {
  green: "Operativo",
  yellow: "Atención",
  red: "Crítico",
};

interface SemaphoreIndicatorProps {
  status: SemaphoreStatus;
  className?: string;
  showLabel?: boolean;
}

export function SemaphoreIndicator({
  status,
  className,
  showLabel = false,
}: SemaphoreIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-block h-3 w-3 rounded-full shadow-sm ring-2 ring-white",
          STATUS_STYLES[status]
        )}
        aria-hidden
      />
      {showLabel && (
        <span className="text-xs font-medium text-slate-600">{STATUS_LABELS[status]}</span>
      )}
    </div>
  );
}
