import type { StationSummary } from "@/types";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { ComplianceBadge } from "@/components/ui/Badge";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MonitoringPointsTableProps {
  summaries: StationSummary[];
  title?: string;
  description?: string;
  contentKey?: string;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
}

export function MonitoringPointsTable({
  summaries,
  title = "Puntos de monitoreo (P1 – P6)",
  description = "Estado de cumplimiento ECA según última medición simulada",
  contentKey,
  selectedStationId,
  onStationSelect,
}: MonitoringPointsTableProps) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">
              {description}
              {onStationSelect && " · Clic en fila para ver detalle"}
            </CardDescription>
          </div>
          <SimulatedDataIndicator />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Estación</th>
              <th className="px-5 py-3 font-semibold">Tramo</th>
              <th className="px-5 py-3 font-semibold">pH</th>
              <th className="px-5 py-3 font-semibold">OD (mg/L)</th>
              <th className="px-5 py-3 font-semibold">Turbidez</th>
              <th className="px-5 py-3 font-semibold">Estado ECA</th>
              <th className="px-5 py-3 font-semibold">Muestreo</th>
            </tr>
          </thead>
          <tbody key={contentKey} className="hv-animate-fade-in">
            {summaries.map(({ station, latestMeasurement, compliance }, index) => {
              const isSelected = selectedStationId === station.id;
              return (
                <tr
                  key={station.id}
                  onClick={() => onStationSelect?.(station.id)}
                  className={cn(
                    "border-b border-slate-50 transition-all duration-200",
                    onStationSelect && "cursor-pointer hover:bg-cyan-50/60",
                    isSelected && "bg-cyan-50 ring-1 ring-inset ring-cyan-300/60"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  role={onStationSelect ? "button" : undefined}
                  tabIndex={onStationSelect ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onStationSelect && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onStationSelect(station.id);
                    }
                  }}
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{station.id}</div>
                    <div className="text-xs text-slate-500">
                      {station.name.replace(/^Estación \w+ — /, "")}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{station.riverSegment}</td>
                  <td className="px-5 py-3 font-mono text-slate-700">{latestMeasurement.ph}</td>
                  <td className="px-5 py-3 font-mono text-slate-700">
                    {latestMeasurement.dissolvedOxygen}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-700">
                    {latestMeasurement.turbidity} NTU
                  </td>
                  <td className="px-5 py-3">
                    <ComplianceBadge
                      status={compliance.status}
                      label={getComplianceLabel(compliance.status)}
                    />
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {formatDate(latestMeasurement.sampledAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
