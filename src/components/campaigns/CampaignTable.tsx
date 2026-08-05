import Link from "next/link";
import { Eye } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateOnly } from "@/lib/utils";
import type { CampanaSummary } from "@/types/campaign";

interface CampaignTableProps {
  campaigns: CampanaSummary[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-base">Campañas de monitoreo</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Código</th>
              <th className="px-5 py-3 font-semibold">Nombre de campaña</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 font-semibold">Responsable</th>
              <th className="px-5 py-3 font-semibold">Estaciones</th>
              <th className="px-5 py-3 font-semibold">Parámetros</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Observaciones</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-slate-50 transition-colors hover:bg-cyan-50/40"
              >
                <td className="px-5 py-3 font-mono text-xs font-semibold text-cyan-700">
                  {campaign.codigo}
                </td>
                <td className="px-5 py-3 font-medium text-slate-900">{campaign.nombre}</td>
                <td className="px-5 py-3 text-slate-600">{formatDateOnly(campaign.fechaInicio)}</td>
                <td className="px-5 py-3 text-slate-600">{campaign.responsableNombre}</td>
                <td className="px-5 py-3 text-center font-semibold text-slate-800">
                  {campaign.estacionCount}
                </td>
                <td className="px-5 py-3 text-center font-semibold text-slate-800">
                  {campaign.parametroCount}
                </td>
                <td className="px-5 py-3">
                  <CampaignStatusBadge status={campaign.estado} />
                </td>
                <td className="max-w-[200px] truncate px-5 py-3 text-xs text-slate-500">
                  {campaign.observaciones || "—"}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/campanas/${campaign.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
