import { Activity, MapPin, Radio, Waves } from "lucide-react";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import type { StationStats } from "@/types/station-management";

const items: readonly KpiItem<StationStats>[] = [
  {
    key: "total",
    label: "Total estaciones",
    icon: MapPin,
    color: "text-cyan-600 bg-cyan-50",
    getValue: (s) => s.total,
  },
  {
    key: "activas",
    label: "Activas",
    icon: Activity,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => s.activas,
  },
  {
    key: "inactivas",
    label: "Inactivas",
    icon: Radio,
    color: "text-slate-600 bg-slate-100",
    getValue: (s) => s.inactivas,
  },
  {
    key: "mantenimiento",
    label: "Mantenimiento",
    icon: Waves,
    color: "text-amber-600 bg-amber-50",
    getValue: (s) => s.mantenimiento,
  },
];

interface StationKpiCardsProps {
  stats: StationStats;
}

export function StationKpiCards({ stats }: StationKpiCardsProps) {
  return <KpiGrid data={stats} items={items} />;
}
