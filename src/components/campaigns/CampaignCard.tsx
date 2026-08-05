import Link from "next/link";
import { Eye, MapPin, TestTube2 } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDateOnly } from "@/lib/utils";
import type { CampanaSummary } from "@/types/campaign";

interface CampaignCardProps {
  campaign: CampanaSummary;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-cyan-700">
              {campaign.codigo}
            </span>
            <p className="mt-2 text-base font-semibold text-slate-900">{campaign.nombre}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateOnly(campaign.fechaInicio)} · {campaign.responsableNombre}
            </p>
          </div>
          <CampaignStatusBadge status={campaign.estado} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {campaign.estacionCount} estaciones
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <TestTube2 className="h-3.5 w-3.5 text-slate-400" />
            {campaign.muestraCount} muestras
          </div>
        </div>

        {campaign.observaciones && (
          <p className="mt-3 line-clamp-2 text-xs text-slate-500">{campaign.observaciones}</p>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href={`/campanas/${campaign.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-700"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver detalles
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface CampaignCardGridProps {
  campaigns: CampanaSummary[];
}

export function CampaignCardGrid({ campaigns }: CampaignCardGridProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          No se encontraron campañas con los filtros aplicados.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
