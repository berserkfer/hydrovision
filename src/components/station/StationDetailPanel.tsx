import {
  MapPin,
  Mountain,
  Calendar,
  Radio,
  X,
  Droplets,
  type LucideIcon,
} from "lucide-react";
import type { StationDetail } from "@/types/station";
import { OPERATIONAL_STATUS_LABELS } from "@/types/station";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { ComplianceBadge } from "@/components/ui/Badge";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { ParameterCard } from "./ParameterCard";
import { StationHistoryCard } from "./StationHistoryCard";

interface StationDetailPanelProps {
  detail: StationDetail;
  onClose: () => void;
}

const STATUS_COLORS = {
  active: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  maintenance: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  offline: "bg-slate-500/15 text-slate-600 ring-slate-500/30",
};

/**
 * Panel lateral derecho con información completa de la estación seleccionada.
 */
export function StationDetailPanel({ detail, onClose }: StationDetailPanelProps) {
  const { entity, measurement, compliance, parameters, history } = detail;

  return (
    <aside className="hv-animate-fade-in h-fit w-full shrink-0">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Cabecera */}
        <div className="border-b border-slate-700/10 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                <Droplets className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{entity.code}</p>
                <p className="text-xs text-slate-300">{entity.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-600/50 hover:text-white"
              aria-label="Cerrar panel de estación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ComplianceBadge
              status={compliance.status}
              label={getComplianceLabel(compliance.status)}
            />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_COLORS[entity.operationalStatus]}`}
            >
              <Radio className="h-3 w-3" />
              {OPERATIONAL_STATUS_LABELS[entity.operationalStatus]}
            </span>
            <SimulatedDataIndicator variant="dark" />
          </div>
        </div>

        <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-4">
          {/* Información general */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Información general</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-xs">
              <InfoRow icon={MapPin} label="Coordenadas" value={`${entity.latitude}, ${entity.longitude}`} />
              <InfoRow icon={Mountain} label="Altitud" value={`${entity.altitude} m s.n.m.`} />
              <InfoRow icon={Droplets} label="Río" value={entity.river} />
              <InfoRow icon={Droplets} label="Cuenca" value={entity.watershed} />
              <InfoRow icon={MapPin} label="Tramo" value={entity.riverSegment} />
              <InfoRow icon={Calendar} label="Instalación" value={formatDate(`${entity.installedAt}T08:00:00-05:00`)} />
              <InfoRow icon={Calendar} label="Última actualización" value={formatDate(entity.lastUpdatedAt)} />
            </CardContent>
          </Card>

          {/* Parámetros */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parámetros fisicoquímicos
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {parameters.map((param) => (
                <ParameterCard key={param.key} param={param} />
              ))}
            </div>
          </div>

          {/* Clasificación ECA */}
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clasificación ECA
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ComplianceBadge
                  status={compliance.status}
                  label={getComplianceLabel(compliance.status)}
                />
                <span className="text-xs text-slate-500">
                  Última medición: {formatDate(measurement.sampledAt)}
                </span>
              </div>
              {compliance.violatedParameters.length > 0 && (
                <p className="mt-2 text-xs text-red-600">
                  Parámetros fuera de norma: {compliance.violatedParameters.join(", ")}
                </p>
              )}
              {compliance.alertParameters.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  En alerta: {compliance.alertParameters.join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Historial */}
          <StationHistoryCard history={history} />
        </div>
      </div>
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-slate-600">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="font-medium text-slate-500">{label}:</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
