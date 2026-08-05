"use client";

import Link from "next/link";
import { Eye, MapPin, TestTube2 } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { formatDateOnly } from "@/lib/utils";
import type { CampanaSummary } from "@/types/campaign";

interface CampaignListProps {
  campaigns: CampanaSummary[];
  totalFiltered: number;
}

export function CampaignList({ campaigns, totalFiltered }: CampaignListProps) {
  if (totalFiltered === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-slate-500">No se encontraron campañas con los filtros aplicados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          className="transition-shadow duration-300 hover:shadow-md"
        >
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-cyan-700">
                    {campaign.codigo}
                  </span>
                  <CampaignStatusBadge status={campaign.estado} />
                </div>
                <CardTitle className="mt-2 text-base">{campaign.nombre}</CardTitle>
                <CardDescription>
                  {formatDateOnly(campaign.fechaInicio)} · {campaign.responsableNombre}
                </CardDescription>
              </div>
              <Link
                href={`/campanas/${campaign.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver detalle
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Cuenca" value={campaign.cuencaNombre} />
              <InfoItem label="Río" value={campaign.rioNombre} />
              <InfoItem
                label="Estaciones"
                value={String(campaign.estacionCount)}
                icon={<MapPin className="h-3.5 w-3.5 text-slate-400" />}
              />
              <InfoItem
                label="Muestras"
                value={String(campaign.muestraCount)}
                icon={<TestTube2 className="h-3.5 w-3.5 text-slate-400" />}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
        {icon}
        {value}
      </p>
    </div>
  );
}

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
