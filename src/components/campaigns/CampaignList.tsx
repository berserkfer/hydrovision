/** @deprecated Use CampaignCard / CampaignCardGrid from ./CampaignCard */
export { CampaignCard, CampaignCardGrid } from "./CampaignCard";

import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";

interface CampaignListHeaderProps {
  totalFiltered: number;
}

export function CampaignListHeader({ totalFiltered }: CampaignListHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Listado de campañas</h3>
        <p className="text-xs text-slate-500">{totalFiltered} campaña(s) encontrada(s)</p>
      </div>
      <SimulatedDataIndicator />
    </div>
  );
}

/** @deprecated Use CampaignCardGrid */
export { CampaignCardGrid as CampaignList } from "./CampaignCard";
