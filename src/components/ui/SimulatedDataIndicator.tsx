import { cn } from "@/lib/utils";

interface SimulatedDataIndicatorProps {
  className?: string;
}

export function SimulatedDataIndicator({ className }: SimulatedDataIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ring-1 ring-inset",
        "bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)] ring-[var(--hv-disclaimer-border)]",
        className
      )}
      role="status"
      aria-label="Datos simulados"
    >
      <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-amber-500" aria-hidden />
      Datos simulados
    </span>
  );
}
