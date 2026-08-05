import Link from "next/link";
import { Radio } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatShortDate } from "@/lib/utils";
import type { MonitoringStationRecord } from "@/types/station-management";
import {
  STATION_STATUS_COLORS,
  STATION_STATUS_UI_LABELS,
} from "@/types/station-management";

interface StationTableProps {
  stations: MonitoringStationRecord[];
}

export function StationTable({ stations }: StationTableProps) {
  if (stations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          No se encontraron estaciones con los filtros aplicados.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-base">Estaciones de monitoreo</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Código</th>
              <th className="px-5 py-3 font-semibold">Nombre</th>
              <th className="px-5 py-3 font-semibold">Río</th>
              <th className="px-5 py-3 font-semibold">Cuenca</th>
              <th className="px-5 py-3 font-semibold">Departamento</th>
              <th className="px-5 py-3 font-semibold">Latitud</th>
              <th className="px-5 py-3 font-semibold">Longitud</th>
              <th className="px-5 py-3 font-semibold">Altitud</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Última campaña</th>
              <th className="px-5 py-3 font-semibold">Clasificación ECA</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr
                key={station.id}
                className="border-b border-slate-50 transition-colors hover:bg-cyan-50/40"
              >
                <td className="px-5 py-3 font-mono font-semibold text-slate-900">{station.codigo}</td>
                <td className="px-5 py-3 text-slate-800">{station.nombre}</td>
                <td className="px-5 py-3 text-slate-600">{station.rioNombre}</td>
                <td className="px-5 py-3 text-slate-600">{station.cuencaNombre}</td>
                <td className="px-5 py-3 text-slate-600">{station.departamentoNombre}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{station.latitud.toFixed(4)}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{station.longitud.toFixed(4)}</td>
                <td className="px-5 py-3 text-slate-600">{station.altitud} m</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATION_STATUS_COLORS[station.estado]}`}
                  >
                    <Radio className="h-3 w-3" />
                    {STATION_STATUS_UI_LABELS[station.estado]}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {station.fechaUltimaCampana
                    ? formatShortDate(station.fechaUltimaCampana)
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <ComplianceBadge
                    status={station.clasificacionEca}
                    label={getComplianceLabel(station.clasificacionEca)}
                  />
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/estaciones/${station.id}`}
                    className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
                  >
                    Ver detalles
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
