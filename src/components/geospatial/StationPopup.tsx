import type { GeoStationMarker } from "@/types/geospatial-center";
import { GEO_STATUS_LABELS } from "@/types/geospatial-center";

interface StationPopupProps {
  station: GeoStationMarker;
}

export function StationPopup({ station }: StationPopupProps) {
  return (
    <div className="min-w-[180px] space-y-1 text-sm">
      <p className="font-semibold text-slate-900">{station.nombre}</p>
      <p className="font-mono text-xs text-slate-500">{station.codigo}</p>
      <dl className="space-y-0.5 text-xs text-slate-600">
        <div className="flex justify-between gap-3">
          <dt>Río</dt>
          <dd className="font-medium text-slate-800">{station.rioNombre}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Cuenca</dt>
          <dd className="font-medium text-slate-800">{station.cuencaNombre}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Estado</dt>
          <dd className="font-medium text-slate-800">{GEO_STATUS_LABELS[station.status]}</dd>
        </div>
      </dl>
      <p className="pt-1 text-[10px] text-slate-400">Clic para ver detalle completo</p>
    </div>
  );
}
