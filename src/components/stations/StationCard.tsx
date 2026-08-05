import Link from "next/link";
import { MapPin } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatShortDate } from "@/lib/utils";
import type { MonitoringStationRecord } from "@/types/station-management";
import {
  STATION_STATUS_COLORS,
  STATION_STATUS_UI_LABELS,
} from "@/types/station-management";

interface StationCardProps {
  station: MonitoringStationRecord;
}

export function StationCard({ station }: StationCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-bold text-slate-900">{station.codigo}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-700">{station.nombre}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATION_STATUS_COLORS[station.estado]}`}
          >
            {STATION_STATUS_UI_LABELS[station.estado]}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {station.tramo} · {station.rioNombre}
          </p>
          <p>
            <span className="text-slate-500">Coordenadas:</span>{" "}
            <span className="font-mono">
              {station.latitud.toFixed(4)}, {station.longitud.toFixed(4)}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Última campaña:</span>{" "}
            {station.fechaUltimaCampana
              ? formatShortDate(station.fechaUltimaCampana)
              : "—"}
          </p>
          <p>
            <span className="text-slate-500">Mediciones:</span>{" "}
            <span className="font-semibold text-slate-800">{station.cantidadMediciones}</span>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <ComplianceBadge
            status={station.clasificacionEca}
            label={getComplianceLabel(station.clasificacionEca)}
          />
          <Link
            href={`/estaciones/${station.id}`}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-700"
          >
            Ver detalles
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface StationCardGridProps {
  stations: MonitoringStationRecord[];
}

export function StationCardGrid({ stations }: StationCardGridProps) {
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
}
