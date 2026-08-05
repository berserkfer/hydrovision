"use client";

import Link from "next/link";
import { ArrowLeft, Beaker, BookOpen, FlaskConical } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import {
  formatEcaLimit,
  interpretParameterStatus,
} from "@/lib/eca/parameter-classifier";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { PARAMETER_CATEGORY_LABELS } from "@/lib/parameters/catalog";
import { formatShortDate } from "@/lib/utils";
import type { ParameterDetailData } from "@/types/parameter-management";

interface ParameterDetailProps {
  detail: ParameterDetailData;
}

export function ParameterDetail({ detail }: ParameterDetailProps) {
  const { definition } = detail;
  const chartData = detail.history
    .slice()
    .reverse()
    .map((h) => ({
      fecha: h.fecha.slice(5),
      value: h.value,
      estacion: h.estacionCodigo,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/parametros"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a parámetros
        </Link>
        <SimulatedDataIndicator />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{definition.name}</p>
                <p className="text-sm text-cyan-100">
                  {PARAMETER_CATEGORY_LABELS[definition.category]}
                </p>
              </div>
            </div>
            <ComplianceBadge
              status={detail.latestStatus}
              label={getComplianceLabel(detail.latestStatus)}
            />
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-cyan-600" />
                Descripción científica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>{definition.description}</p>
              <InfoRow label="Unidad" value={definition.unit} />
              <InfoRow label="Método de medición" value={definition.measurementMethod} />
              <InfoRow label="Límite ECA orientativo" value={formatEcaLimit(definition.code)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Beaker className="h-4 w-4 text-cyan-600" />
                Valor registrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-bold text-slate-900">
                {detail.latestValue}{" "}
                <span className="text-lg font-normal text-slate-400">{definition.unit}</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Última medición: {formatShortDate(detail.latestFecha)} · Estación{" "}
                {detail.latestEstacion}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <StatPill label="Cumple" value={detail.statusDistribution.compliant} color="emerald" />
                <StatPill label="Alerta" value={detail.statusDistribution.alert} color="amber" />
                <StatPill
                  label="No cumple"
                  value={detail.statusDistribution.non_compliant}
                  color="red"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gráfico temporal</CardTitle>
          <CardDescription>Histórico simulado de mediciones del parámetro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value} ${definition.unit}`, definition.name]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name={definition.name}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretación</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-700">
            <p>{interpretParameterStatus(definition.code, detail.latestStatus)}</p>
            <p className="mt-3 text-slate-500">{definition.interpretationGuide}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clasificación ECA</CardTitle>
            <CardDescription>Evaluación automática con umbrales orientativos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ComplianceBadge
              status={detail.latestStatus}
              label={getComplianceLabel(detail.latestStatus)}
            />
            <p className="text-sm text-slate-600">
              Rango ECA: <span className="font-mono">{formatEcaLimit(definition.code)}</span>{" "}
              {definition.unit}
            </p>
            <p className="text-xs text-slate-500">
              Clasificador basado en la misma lógica que el módulo ECA del Dashboard. Datos
              simulados — normativa referencial para tesis.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de mediciones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Estación</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detail.history.map((h) => (
                <tr key={`${h.fecha}-${h.estacionCodigo}`} className="border-b border-slate-50">
                  <td className="px-5 py-3">{formatShortDate(h.fecha)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{h.estacionCodigo}</td>
                  <td className="px-5 py-3 font-mono">{h.value}</td>
                  <td className="px-5 py-3">
                    <ComplianceBadge status={h.status} label={getComplianceLabel(h.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-slate-800">{value}</p>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "red";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-lg px-3 py-2 ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase">{label}</p>
    </div>
  );
}
