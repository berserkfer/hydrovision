import { InfoBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";

interface MonitoringHeaderProps {
  lastUpdate: string;
  /** Título principal dinámico según río seleccionado */
  title: string;
  /** Subtítulo con ubicación geográfica */
  subtitle: string;
}

/**
 * Encabezado del dashboard con título dinámico (Fase 2.2).
 * Componente nuevo — no modifica Header.tsx existente.
 */
export function MonitoringHeader({ lastUpdate, title, subtitle }: MonitoringHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 transition-all duration-300">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500 transition-all duration-300">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InfoBadge variant="warning">Datos simulados</InfoBadge>
          <InfoBadge variant="info">Última actualización: {formatDate(lastUpdate)}</InfoBadge>
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {SIMULATION_DISCLAIMER}
      </p>
    </header>
  );
}
