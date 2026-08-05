import type { DashboardStats } from "@/types";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react";

const items: readonly KpiItem<DashboardStats>[] = [
  {
    key: "total",
    label: "Estaciones activas",
    icon: MapPin,
    color: "text-sky-600 bg-sky-50",
    getValue: (s) => s.totalStations,
  },
  {
    key: "compliant",
    label: "Cumple ECA",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => s.compliantCount,
  },
  {
    key: "alert",
    label: "En alerta",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50",
    getValue: (s) => s.alertCount,
  },
  {
    key: "nonCompliant",
    label: "No cumple",
    icon: XCircle,
    color: "text-red-600 bg-red-50",
    getValue: (s) => s.nonCompliantCount,
  },
];

export function KpiCards({ stats }: { stats: DashboardStats }) {
  return <KpiGrid data={stats} items={items} />;
}
