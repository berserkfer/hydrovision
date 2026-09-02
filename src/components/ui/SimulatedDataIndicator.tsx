import { cn } from "@/lib/utils";

interface SimulatedDataIndicatorProps {
  className?: string;
}

export function SimulatedDataIndicator({ className }: SimulatedDataIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        "bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)] ring-[var(--hv-disclaimer-border)]",
        className
      )}
      role="status"
      aria-label="Datos simulados"
    >
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500" />
      Datos simulados
    </span>
  );
}
