import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PARAMETER_CATEGORY_LABELS } from "@/lib/parameters/catalog";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatShortDate } from "@/lib/utils";
import type { WaterParameterRecord } from "@/types/parameter-management";
import {
  PARAMETER_TREND_COLORS,
  PARAMETER_TREND_LABELS,
} from "@/types/parameter-management";

interface ParameterTableProps {
  records: WaterParameterRecord[];
}

export function ParameterTable({ records }: ParameterTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          No se encontraron parámetros con los filtros aplicados.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-base">Parámetros de calidad del agua</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Parámetro</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Unidad</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Límite ECA</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Tendencia</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Estación</th>
              <th className="px-4 py-3 font-semibold">Campaña</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-slate-50 transition-colors hover:bg-cyan-50/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/parametros/${record.parameterCode}`}
                    className="font-medium text-cyan-700 hover:text-cyan-800"
                  >
                    {record.parameterName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {PARAMETER_CATEGORY_LABELS[record.category]}
                </td>
                <td className="px-4 py-3 text-slate-500">{record.unit}</td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                  {record.value}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.ecaLimit}</td>
                <td className="px-4 py-3">
                  <ComplianceBadge
                    status={record.status}
                    label={getComplianceLabel(record.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <TrendBadge trend={record.trend} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatShortDate(record.fecha)}</td>
                <td className="px-4 py-3 font-mono text-xs">{record.estacionCodigo}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{record.campanaCodigo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function TrendBadge({ trend }: { trend: WaterParameterRecord["trend"] }) {
  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${PARAMETER_TREND_COLORS[trend]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {PARAMETER_TREND_LABELS[trend]}
    </span>
  );
}
