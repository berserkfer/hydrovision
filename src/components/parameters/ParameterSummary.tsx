import { Activity, AlertTriangle, CheckCircle2, FlaskConical } from "lucide-react";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import type { ParameterSummaryStats } from "@/types/parameter-management";

const items: readonly KpiItem<ParameterSummaryStats>[] = [
  {
    key: "total",
    label: "Total parámetros",
    icon: FlaskConical,
    color: "text-cyan-600 bg-cyan-50",
    getValue: (s) => s.total,
  },
  {
    key: "cumple",
    label: "Cumplen ECA",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => s.cumple,
  },
  {
    key: "alerta",
    label: "En alerta",
    icon: Activity,
    color: "text-amber-600 bg-amber-50",
    getValue: (s) => s.enAlerta,
  },
  {
    key: "noCumple",
    label: "No cumplen",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-50",
    getValue: (s) => s.noCumple,
  },
];

interface ParameterSummaryProps {
  stats: ParameterSummaryStats;
}

export function ParameterSummary({ stats }: ParameterSummaryProps) {
  return <KpiGrid data={stats} items={items} />;
}
