import { DataTag } from "@/components/ui/DataTag";
import { InkFlow } from "@/components/ui/InkFlow";
import { formatDate } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";

interface MonitoringHeaderProps {
  title: string;
  subtitle: string;
  lastUpdate?: string;
  /** Etiquetas de origen propias del módulo. Si se omite, se muestra "Datos simulados". */
  origin?: React.ReactNode;
  /** Muestra el aviso general de datos reales + simulados (por defecto sí). */
  showDisclaimer?: boolean;
}

/** Cabecera de módulo: misma gramática que el héroe del dashboard, en versión compacta. */
export function MonitoringHeader({
  lastUpdate,
  title,
  subtitle,
  origin,
  showDisclaimer = true,
}: MonitoringHeaderProps) {
  return (
    <header className="relative isolate shrink-0 overflow-hidden border-b border-[var(--hv-header-border)]">
      <div
        className="absolute inset-y-0 right-0 -z-10 hidden w-[52%] md:block"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, #000 45%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 45%)",
        }}
      >
        <InkFlow seed={title.length * 131 + 7} density={0.55} outlet={{ x: 0.8, y: 0.38 }} strength={0.75} />
      </div>

      <div className="px-5 pb-4 pt-6 md:px-8 lg:px-12">
        <p className="hv-eyebrow text-[9.5px]">HydroVision · Dren 4000</p>
        <h1 className="mt-2 text-[28px] font-light leading-tight tracking-[-0.02em] text-[var(--hv-ink)] md:text-[32px]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--hv-foreground-muted)]">{subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {origin ?? <DataTag tone="simulated">Datos simulados</DataTag>}
          {lastUpdate && (
            <DataTag tone="neutral">Última actualización: {formatDate(lastUpdate)}</DataTag>
          )}
        </div>
        {showDisclaimer && (
          <p className="mt-3 flex max-w-[900px] items-start gap-2.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
            <span className="mt-[5px] h-2 w-2 shrink-0 rotate-45 bg-amber-500" aria-hidden />
            {SIMULATION_DISCLAIMER}
          </p>
        )}
      </div>
    </header>
  );
}
