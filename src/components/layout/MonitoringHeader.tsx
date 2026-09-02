import { InfoBadge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDate } from "@/lib/utils";
import { SIMULATION_DISCLAIMER } from "@/lib/data/simulated";

interface MonitoringHeaderProps {
  lastUpdate: string;
  title: string;
  subtitle: string;
}

export function MonitoringHeader({ lastUpdate, title, subtitle }: MonitoringHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[var(--hv-header-border)] bg-[var(--hv-header-bg)] px-6 py-4 dark:bg-gradient-to-r dark:from-[#060e1a] dark:via-[#0b1424] dark:to-[#0a1628]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--hv-foreground)] transition-all duration-300">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--hv-foreground-muted)] transition-all duration-300">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          <InfoBadge variant="warning">Datos simulados</InfoBadge>
          <InfoBadge variant="info">Última actualización: {formatDate(lastUpdate)}</InfoBadge>
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs text-[var(--hv-disclaimer-text)]">
        {SIMULATION_DISCLAIMER}
      </p>
    </header>
  );
}
