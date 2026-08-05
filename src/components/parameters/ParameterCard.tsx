import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { PARAMETER_CATEGORY_LABELS } from "@/lib/parameters/catalog";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatShortDate } from "@/lib/utils";
import type { WaterParameterRecord } from "@/types/parameter-management";
import {
  PARAMETER_TREND_COLORS,
  PARAMETER_TREND_LABELS,
} from "@/types/parameter-management";

interface ParameterCardProps {
  record: WaterParameterRecord;
}

export function ParameterCard({ record }: ParameterCardProps) {
  const TrendIcon =
    record.trend === "up" ? TrendingUp : record.trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/parametros/${record.parameterCode}`}
              className="text-base font-semibold text-cyan-700 hover:text-cyan-800"
            >
              {record.parameterName}
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">
              {PARAMETER_CATEGORY_LABELS[record.category]}
            </p>
          </div>
          <ComplianceBadge status={record.status} label={getComplianceLabel(record.status)} />
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-slate-900">{record.value}</span>
          <span className="text-sm text-slate-400">{record.unit}</span>
        </div>

        <div className="mt-3 space-y-1 text-xs text-slate-600">
          <p>ECA: {record.ecaLimit}</p>
          <p>Estación: {record.estacionCodigo}</p>
          <p>Campaña: {record.campanaCodigo}</p>
          <p>Fecha: {formatShortDate(record.fecha)}</p>
        </div>

        <div
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${PARAMETER_TREND_COLORS[record.trend]}`}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {PARAMETER_TREND_LABELS[record.trend]}
        </div>
      </CardContent>
    </Card>
  );
}

interface ParameterCardGridProps {
  records: WaterParameterRecord[];
}

export function ParameterCardGrid({ records }: ParameterCardGridProps) {
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => (
        <ParameterCard key={record.id} record={record} />
      ))}
    </div>
  );
}
