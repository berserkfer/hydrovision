"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Cloud,
  Droplets,
  FlaskConical,
  MapPin,
  User,
} from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { CLIMA_LABELS, COLOR_APARENTE_LABELS } from "@/constants/sampling";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { ECA_STANDARDS } from "@/lib/eca/standards";
import { formatDate } from "@/lib/utils";
import type { MuestraDetail } from "@/types/sampling";
import { cn } from "@/lib/utils";

interface SampleDetailViewProps {
  sample: MuestraDetail;
}

const ECA_STATUS_CARD = {
  compliant: "border-emerald-200 bg-emerald-50/80",
  alert: "border-amber-200 bg-amber-50/80",
  non_compliant: "border-red-200 bg-red-50/80",
} as const;

export function SampleDetailView({ sample }: SampleDetailViewProps) {
  const { parametros } = sample;

  const paramRows = [
    { label: "pH", value: parametros.ph, unit: "—", key: "ph" },
    { label: "Temperatura", value: parametros.temperatura, unit: "°C", key: "temperature" },
    { label: "Conductividad", value: parametros.conductividad, unit: "µS/cm", key: "conductivity" },
    { label: "Oxígeno disuelto", value: parametros.oxigenoDisuelto, unit: "mg/L", key: "dissolvedOxygen" },
    { label: "Turbidez", value: parametros.turbidez, unit: "NTU", key: "turbidity" },
    { label: "Sólidos disueltos totales", value: parametros.solidosDisueltosTotales, unit: "mg/L", key: "tds" },
    { label: "Caudal", value: parametros.caudal, unit: "m³/s", key: "flow" },
    {
      label: "Color aparente",
      value: COLOR_APARENTE_LABELS[parametros.colorAparente] ?? parametros.colorAparente,
      unit: "",
      key: "color",
    },
  ];

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={sample.updatedAt}
        title={sample.codigoMuestra}
        subtitle={`${sample.estacionCodigo} · ${sample.campanaNombre}`}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Link
            href="/muestreos"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al registro
          </Link>

          <Card
            className={cn(
              "hv-animate-fade-in border-2 transition-shadow duration-300",
              ECA_STATUS_CARD[sample.estadoECA]
            )}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clasificación ECA automática
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <ComplianceBadge
                    status={sample.estadoECA}
                    label={getComplianceLabel(sample.estadoECA)}
                  />
                  <SimulatedDataIndicator />
                </div>
                <p className="mt-2 text-xs text-slate-600">{sample.normativaReferencia}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                Evaluado: {formatDate(sample.evaluadoEn)}
              </div>
            </CardContent>
          </Card>

          {(sample.parametrosViolados.length > 0 || sample.parametrosEnAlerta.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2 hv-animate-fade-in">
              {sample.parametrosViolados.length > 0 && (
                <AlertList title="Parámetros fuera de norma" items={sample.parametrosViolados} variant="danger" />
              )}
              {sample.parametrosEnAlerta.length > 0 && (
                <AlertList title="Parámetros en alerta" items={sample.parametrosEnAlerta} variant="warning" />
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2 hv-animate-fade-in">
            <Card>
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <CardTitle>Información del muestreo</CardTitle>
                <CardDescription>Datos de campo y contexto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow icon={FlaskConical} label="Código" value={sample.codigoMuestra} />
                <DetailRow icon={MapPin} label="Estación" value={`${sample.estacionCodigo} — ${sample.estacionNombre}`} />
                <DetailRow icon={User} label="Responsable" value={sample.responsableNombre} />
                <DetailRow icon={Cloud} label="Clima" value={CLIMA_LABELS[sample.clima] ?? sample.clima} />
                <DetailRow icon={Droplets} label="Campaña" value={`${sample.campanaCodigo} — ${sample.campanaNombre}`} />
                <DetailRow icon={FlaskConical} label="Fecha y hora" value={formatDate(sample.fechaMuestreo)} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Observaciones</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{sample.observaciones}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <CardTitle>Parámetros fisicoquímicos</CardTitle>
                <CardDescription>Mediciones de calidad del agua</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {paramRows.map((row) => (
                    <li key={row.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <span className="text-sm text-slate-600">{row.label}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {typeof row.value === "number" ? row.value.toFixed(2) : row.value}
                        {row.unit && <span className="ml-1 text-xs font-normal text-slate-500">{row.unit}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="hv-animate-fade-in">
            <CardHeader className="border-b border-slate-100 bg-slate-50/30">
              <CardTitle>Referencia ECA (orientativa)</CardTitle>
              <CardDescription>Límites usados por el clasificador automático</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 font-semibold">Parámetro</th>
                      <th className="pb-2 font-semibold">Unidad</th>
                      <th className="pb-2 font-semibold">Mín.</th>
                      <th className="pb-2 font-semibold">Máx.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ECA_STANDARDS.map((s) => (
                      <tr key={s.parameter}>
                        <td className="py-2 text-slate-800">{s.label}</td>
                        <td className="py-2 text-slate-500">{s.unit}</td>
                        <td className="py-2 text-slate-700">{s.min ?? "—"}</td>
                        <td className="py-2 text-slate-700">{s.max ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
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

function AlertList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "danger" | "warning";
}) {
  const styles =
    variant === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <Card className={cn("border", styles)}>
      <CardContent className="py-4">
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
        <ul className="mt-2 list-inside list-disc text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
