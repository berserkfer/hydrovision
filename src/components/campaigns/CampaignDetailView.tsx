"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  MapPin,
  TestTube2,
  User,
  Waves,
} from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoBadge } from "@/components/ui/Badge";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { ESTADO_ESTACION_LABELS } from "@/constants/enums";
import type { EstadoEstacion } from "@/constants/enums";
import { formatDateOnly, formatDateRange } from "@/lib/utils";
import type { CampanaDetail } from "@/types/campaign";

interface CampaignDetailViewProps {
  campaign: CampanaDetail;
}

export function CampaignDetailView({ campaign }: CampaignDetailViewProps) {
  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={campaign.updatedAt}
        title={campaign.nombre}
        subtitle={`${campaign.codigo} · ${campaign.rioNombre}`}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Link
            href="/campanas"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 hv-animate-fade-in">
            <StatCard
              icon={ClipboardList}
              label="Estado"
              value={<CampaignStatusBadge status={campaign.estado} />}
            />
            <StatCard
              icon={MapPin}
              label="Estaciones"
              value={<span className="text-2xl font-bold text-slate-900">{campaign.estacionCount}</span>}
            />
            <StatCard
              icon={TestTube2}
              label="Muestras"
              value={<span className="text-2xl font-bold text-slate-900">{campaign.muestraCount}</span>}
            />
            <StatCard
              icon={Calendar}
              label="Periodo"
              value={
                <span className="text-sm font-semibold text-slate-900">
                  {formatDateRange(campaign.fechaInicio, campaign.fechaFin)}
                </span>
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 hv-animate-fade-in">
            <Card>
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle>Información general</CardTitle>
                  <SimulatedDataIndicator />
                </div>
                <CardDescription>Datos de la campaña de monitoreo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow icon={ClipboardList} label="Código" value={campaign.codigo} />
                <DetailRow icon={User} label="Responsable" value={campaign.responsableNombre} />
                <DetailRow icon={Waves} label="Cuenca" value={campaign.cuencaNombre} />
                <DetailRow icon={Waves} label="Río" value={campaign.rioNombre} />
                <DetailRow
                  icon={Calendar}
                  label="Fecha de inicio"
                  value={formatDateOnly(campaign.fechaInicio)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Fecha de fin"
                  value={formatDateOnly(campaign.fechaFin)}
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Observaciones
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{campaign.objetivo}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <CardTitle>Estaciones asociadas</CardTitle>
                <CardDescription>
                  {campaign.estacionCount} estación(es) en el {campaign.rioNombre}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.estaciones.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay estaciones registradas para este río.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {campaign.estaciones.map((estacion) => (
                      <li
                        key={estacion.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
                              {estacion.codigo}
                            </span>
                            {estacion.nombre}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{estacion.tramo}</p>
                        </div>
                        <InfoBadge variant="info">
                          {ESTADO_ESTACION_LABELS[estacion.estadoOperativo as EstadoEstacion] ??
                            estacion.estadoOperativo}
                        </InfoBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <div className="mt-1">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
