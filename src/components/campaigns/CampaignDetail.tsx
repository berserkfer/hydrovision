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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ComplianceBadge, InfoBadge } from "@/components/ui/Badge";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { ESTADO_ESTACION_LABELS } from "@/constants/enums";
import type { EstadoEstacion } from "@/constants/enums";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatDateOnly, formatDateRange } from "@/lib/utils";
import type { CampanaDetail, CampanaChartPoint } from "@/types/campaign";

interface CampaignDetailProps {
  campaign: CampanaDetail;
}

export function CampaignDetail({ campaign }: CampaignDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/campanas"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
        <SimulatedDataIndicator />
      </div>

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
            <CardTitle>Información general</CardTitle>
            <CardDescription>Datos de la campaña de monitoreo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <DetailRow icon={ClipboardList} label="Código" value={campaign.codigo} />
            <DetailRow icon={User} label="Responsable" value={campaign.responsableNombre} />
            <DetailRow icon={Waves} label="Cuenca" value={campaign.cuencaNombre} />
            <DetailRow icon={Waves} label="Río" value={campaign.rioNombre} />
            <DetailRow icon={Calendar} label="Fecha de inicio" value={formatDateOnly(campaign.fechaInicio)} />
            <DetailRow icon={Calendar} label="Fecha de fin" value={formatDateOnly(campaign.fechaFin)} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Objetivo</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{campaign.objetivo}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Descripción</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{campaign.descripcion}</p>
            </div>
            {campaign.observaciones && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Observaciones</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{campaign.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle>Estaciones con muestreos</CardTitle>
            <CardDescription>
              {campaign.estacionCount} estación(es) con muestreos registrados en la campaña
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {campaign.estaciones.length === 0 ? (
              <p className="text-sm text-slate-500">No hay estaciones registradas.</p>
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

      {campaign.parametros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parámetros registrados</CardTitle>
            <CardDescription>Promedios simulados de la campaña · {campaign.parametroCount} registros</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Parámetro</th>
                  <th className="px-5 py-3 font-semibold">Promedio</th>
                  <th className="px-5 py-3 font-semibold">Mínimo</th>
                  <th className="px-5 py-3 font-semibold">Máximo</th>
                </tr>
              </thead>
              <tbody>
                {campaign.parametros.map((param) => (
                  <tr key={param.key} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{param.label}</td>
                    <td className="px-5 py-3 font-mono">
                      {param.promedio} <span className="text-xs text-slate-400">{param.unit}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">{param.min}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{param.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 hv-animate-fade-in">
        <BarChartCard title="Muestras por periodo" description="Cantidad de muestras simuladas" data={campaign.muestrasPorMes} color="#0891b2" />
        <BarChartCard title="Distribución ECA" description="Clasificación por estación/muestra" data={campaign.ecaPorEstado} color="#059669" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen ECA</CardTitle>
          <CardDescription>Evaluación simulada de cumplimiento normativo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <EcaStat label="Cumple" count={campaign.ecaResumen.cumple} status="compliant" />
            <EcaStat label="En alerta" count={campaign.ecaResumen.enAlerta} status="alert" />
            <EcaStat label="No cumple" count={campaign.ecaResumen.noCumple} status="non_compliant" />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Total evaluaciones: {campaign.ecaResumen.total} · Datos simulados para tesis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BarChartCard({
  title,
  description,
  data,
  color,
}: {
  title: string;
  description: string;
  data: CampanaChartPoint[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end justify-between gap-2">
          {data.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${(point.value / max) * 100}%`,
                  minHeight: point.value > 0 ? "8px" : "2px",
                  backgroundColor: color,
                  opacity: 0.85,
                }}
              />
              <span className="text-[10px] text-slate-500">{point.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EcaStat({
  label,
  count,
  status,
}: {
  label: string;
  count: number;
  status: "compliant" | "alert" | "non_compliant";
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-center">
      <ComplianceBadge status={status} label={getComplianceLabel(status)} />
      <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
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
