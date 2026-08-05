import { MapPin, User, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EnvironmentalStationSummary } from "@/types/environmental-evaluation";

interface EnvironmentalSummaryProps {
  station: EnvironmentalStationSummary;
}

export function EnvironmentalSummary({ station }: EnvironmentalSummaryProps) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-3">
        <CardTitle className="text-base">Resumen de la estación</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryItem icon={MapPin} label="Estación" value={`${station.codigo} — ${station.nombre}`} />
        <SummaryItem icon={Waves} label="Río" value={station.rio} />
        <SummaryItem icon={Waves} label="Cuenca" value={station.cuenca} />
        <SummaryItem icon={MapPin} label="Coordenadas" value={station.coordenadas} mono />
        <SummaryItem icon={MapPin} label="Última campaña" value={station.ultimaCampana} />
        <SummaryItem icon={User} label="Responsable" value={station.responsable} />
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
