import { cn } from "@/lib/utils";

interface SimulatedDataIndicatorProps {
  className?: string;
  /** Variante para fondos oscuros (panel ArcGIS) */
  variant?: "light" | "dark";
}

/**
 * Indicador reutilizable de datos simulados.
 * Visible en panel de control y secciones del módulo de mapa.
 */
export function SimulatedDataIndicator({
  className,
  variant = "light",
}: SimulatedDataIndicatorProps) {
  const styles =
    variant === "dark"
      ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
      : "bg-amber-50 text-amber-700 ring-amber-200/80";

  const dotColor = variant === "dark" ? "bg-amber-400" : "bg-amber-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        styles,
        className
      )}
      role="status"
      aria-label="Datos simulados"
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 animate-pulse rounded-full", dotColor)} />
      Datos simulados
    </span>
  );
}
