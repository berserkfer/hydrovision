import type { CampaignStats } from "@/types/campaign";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import { CalendarClock, CheckCircle2, ClipboardList, PlayCircle } from "lucide-react";

const items: readonly KpiItem<CampaignStats>[] = [
  {
    key: "total",
    label: "Total campañas",
    icon: ClipboardList,
    color: "text-cyan-600 bg-cyan-50",
    getValue: (s) => s.total,
  },
  {
    key: "active",
    label: "En curso",
    icon: PlayCircle,
    color: "text-emerald-600 bg-emerald-50",
    getValue: (s) => s.enCurso,
  },
  {
    key: "planned",
    label: "Planificadas",
    icon: CalendarClock,
    color: "text-sky-600 bg-sky-50",
    getValue: (s) => s.planificadas,
  },
  {
    key: "completed",
    label: "Finalizadas",
    icon: CheckCircle2,
    color: "text-slate-600 bg-slate-100",
    getValue: (s) => s.finalizadas,
  },
];

export function CampaignKpiCards({ stats }: { stats: CampaignStats }) {
  return <KpiGrid data={stats} items={items} />;
}
