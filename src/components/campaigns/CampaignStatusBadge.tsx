import type { EstadoCampana } from "@/constants/enums";
import { ESTADO_CAMPANA_LABELS } from "@/constants/enums";
import { cn } from "@/lib/utils";

const variants: Record<EstadoCampana, string> = {
  planned: "bg-sky-500/15 text-sky-700 ring-sky-500/30",
  active: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  completed: "bg-slate-500/15 text-slate-700 ring-slate-500/30",
  cancelled: "bg-red-500/15 text-red-700 ring-red-500/30",
};

interface CampaignStatusBadgeProps {
  status: EstadoCampana;
  className?: string;
}

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        variants[status],
        className
      )}
    >
      {ESTADO_CAMPANA_LABELS[status]}
    </span>
  );
}
