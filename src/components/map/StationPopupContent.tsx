import type { StationSummary } from "@/types";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { ComplianceBadge } from "@/components/ui/Badge";

interface StationPopupContentProps {
  summary: StationSummary;
}

/**
 * Contenido del popup de cada marcador con parámetros fisicoquímicos simulados.
 */
export function StationPopupContent({ summary }: StationPopupContentProps) {
  const { station, latestMeasurement, compliance } = summary;

  return (
    <div className="min-w-[200px] space-y-2 text-sm">
      <div>
        <p className="font-semibold text-slate-900">{station.name}</p>
        <p className="text-xs text-slate-500">{station.riverSegment}</p>
      </div>

      <ComplianceBadge
        status={compliance.status}
        label={getComplianceLabel(compliance.status)}
      />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-slate-500">pH</dt>
        <dd className="font-mono font-medium text-slate-800">{latestMeasurement.ph}</dd>

        <dt className="text-slate-500">Oxígeno disuelto</dt>
        <dd className="font-mono font-medium text-slate-800">
          {latestMeasurement.dissolvedOxygen} mg/L
        </dd>

        <dt className="text-slate-500">Turbidez</dt>
        <dd className="font-mono font-medium text-slate-800">
          {latestMeasurement.turbidity} NTU
        </dd>

        <dt className="text-slate-500">Temperatura</dt>
        <dd className="font-mono font-medium text-slate-800">
          {latestMeasurement.temperature} °C
        </dd>

        <dt className="text-slate-500">Conductividad</dt>
        <dd className="font-mono font-medium text-slate-800">
          {latestMeasurement.conductivity} µS/cm
        </dd>
      </dl>

      <p className="text-[10px] text-slate-400">Datos simulados · Fase 2</p>
    </div>
  );
}
