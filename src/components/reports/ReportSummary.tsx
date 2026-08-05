import { Activity, AlertTriangle, CheckCircle2, MapPin, TestTube2 } from "lucide-react";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import type { ReportExecutiveStats } from "@/types/report-management";

const items: readonly KpiItem<ReportExecutiveStats>[] = [
  {
    key: "estaciones",
    label: "Estaciones",
    icon: MapPin,
    color: "text-cyan-600 bg-cyan-50",
    getValue: (s) => s.totalEstaciones,
  },
  {
    key: "campanas",
    label: "Campañas",
    icon: TestTube2,
    color: "text-sky-600 bg-sky-50",
    getValue: (s) => s.totalCampanas,
  },
  {
    key: "eca",
    label: "Cumplimiento ECA",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => `${s.cumplimientoEca}%`,
  },
  {
    key: "alertas",
    label: "Alertas activas",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50",
    getValue: (s) => s.alertasActivas,
  },
  {
    key: "riesgo",
    label: "Índice riesgo",
    icon: Activity,
    color: "text-red-600 bg-red-50",
    getValue: (s) => s.indiceRiesgoPromedio,
  },
];

interface ReportSummaryProps {
  stats: ReportExecutiveStats;
}

export function ReportSummary({ stats }: ReportSummaryProps) {
  return <KpiGrid data={stats} items={items} columns="2" />;
}
