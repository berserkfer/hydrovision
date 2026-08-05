import type { SampleStats } from "@/types/sampling";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import { AlertTriangle, CheckCircle2, TestTube2, XCircle } from "lucide-react";

const items: readonly KpiItem<SampleStats>[] = [
  {
    key: "total",
    label: "Total muestras",
    icon: TestTube2,
    color: "text-cyan-600 bg-cyan-50",
    getValue: (s) => s.total,
  },
  {
    key: "compliant",
    label: "Cumple ECA",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => s.cumple,
  },
  {
    key: "alert",
    label: "En alerta",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50",
    getValue: (s) => s.alerta,
  },
  {
    key: "nonCompliant",
    label: "No cumple",
    icon: XCircle,
    color: "text-red-600 bg-red-50",
    getValue: (s) => s.noCumple,
  },
];

export function SampleKpiCards({ stats }: { stats: SampleStats }) {
  return <KpiGrid data={stats} items={items} />;
}
