import { cn } from "@/lib/utils";

/**
 * Etiqueta de honestidad del dato: origen, estado de calibración o nivel de confianza.
 * Compacta y en mayúsculas espaciadas, pero siempre con borde y marca de color — nunca solo
 * texto gris — para que no se pierda al lado de un número.
 *
 * - real:        dato medido/publicado (punto sólido de tinta)
 * - simulated:   dato simulado de demostración (anillo ocre)
 * - caution:     no calibrado, bibliográfico, escala genérica, umbral no normativo (rombo ocre)
 * - neutral:     contexto técnico (fuente, resolución, aproximación)
 */
export type DataTagTone = "real" | "simulated" | "caution" | "neutral";

const TONE: Record<DataTagTone, { box: string; mark: string }> = {
  real: {
    box: "border-[var(--hv-ink)]/30 text-[var(--hv-ink)]",
    mark: "h-1.5 w-1.5 rounded-full bg-[var(--hv-ink)]",
  },
  simulated: {
    box: "border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)]",
    mark: "h-2 w-2 rounded-full border-[1.5px] border-amber-500",
  },
  caution: {
    box: "border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)]",
    mark: "h-1.5 w-1.5 rotate-45 bg-amber-500",
  },
  neutral: {
    box: "border-[var(--hv-border-subtle)] text-[var(--hv-foreground-muted)]",
    mark: "h-1.5 w-1.5 rounded-full border border-[var(--hv-foreground-dim)]",
  },
};

interface DataTagProps {
  tone: DataTagTone;
  children: React.ReactNode;
  className?: string;
  title?: string;
  /** Sobre fondo de tinta (tarjeta activa): real/neutral pasan a blanco. */
  inverted?: boolean;
}

const INVERTED: Partial<Record<DataTagTone, { box: string; mark: string }>> = {
  real: { box: "border-white/40 text-white", mark: "h-1.5 w-1.5 rounded-full bg-white" },
  neutral: { box: "border-white/35 text-white/85", mark: "h-1.5 w-1.5 rounded-full border border-white/70" },
};

export function DataTag({ tone, children, className, title, inverted = false }: DataTagProps) {
  const t = (inverted && INVERTED[tone]) || TONE[tone];
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-[3px] border px-1.5 py-[3px] text-[10px] font-medium uppercase leading-none tracking-[0.12em]",
        t.box,
        className
      )}
    >
      <span className={cn("shrink-0", t.mark)} aria-hidden />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
