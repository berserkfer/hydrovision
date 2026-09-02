"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Droplets,
  MapPin,
  Mountain,
  Radio,
  Satellite,
} from "lucide-react";
import { ParameterCard } from "@/components/station/ParameterCard";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { ESTADO_CAMPANA_LABELS } from "@/constants/enums";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { buildParameterConfigs } from "@/lib/station/station-utils";
import { formatDate, formatShortDate } from "@/lib/utils";
import type { StationDetailRecord } from "@/types/station-management";
import {
  STATION_STATUS_COLORS,
  STATION_STATUS_UI_LABELS,
} from "@/types/station-management";

interface StationDetailProps {
  detail: StationDetailRecord;
}

function HistoricalChart({
  title,
  data,
  color,
  unit,
}: {
  title: string;
  data: { fecha: string; value: number }[];
  color: string;
  unit: string;
}) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">Serie simulada · {unit}</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 40" className="h-24 w-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
          <span>{formatShortDate(data[0]?.fecha ?? "")}</span>
          <span>{formatShortDate(data[data.length - 1]?.fecha ?? "")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StationDetail({ detail }: StationDetailProps) {
  const { station, campanas, mediciones, indicesSatelitales, parametrosViolados, parametrosEnAlerta } =
    detail;

  const ultimaMedicion = mediciones[mediciones.length - 1];
  const measurement = ultimaMedicion
    ? {
        ph: ultimaMedicion.ph,
        temperature: ultimaMedicion.temperatura,
        conductivity: ultimaMedicion.conductividad,
        dissolvedOxygen: ultimaMedicion.oxigenoDisuelto,
        turbidity: ultimaMedicion.turbidez,
        totalDissolvedSolids:
          ultimaMedicion.conductividad !== undefined
            ? Number((ultimaMedicion.conductividad * 0.65).toFixed(1))
            : undefined,
        flowRate: 3.5,
        sampledAt: `${ultimaMedicion.fecha}T10:00:00-05:00`,
        isSimulated: true as const,
      }
    : null;

  const parameters = measurement ? buildParameterConfigs(measurement) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/estaciones"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a estaciones
        </Link>
        <SimulatedDataIndicator />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-700/10 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                <Droplets className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{station.codigo}</p>
                <p className="text-sm text-slate-300">{station.nombre}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ComplianceBadge
                status={station.clasificacionEca}
                label={getComplianceLabel(station.clasificacionEca)}
              />
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATION_STATUS_COLORS[station.estado]}`}
              >
                <Radio className="h-3.5 w-3.5" />
                {STATION_STATUS_UI_LABELS[station.estado]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Información general</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoRow icon={MapPin} label="Ubicación" value={`${station.tramo} · ${station.departamentoNombre}`} />
              <InfoRow icon={Droplets} label="Río" value={station.rioNombre} />
              <InfoRow icon={Droplets} label="Cuenca" value={station.cuencaNombre} />
              <InfoRow icon={MapPin} label="Coordenadas" value={`${station.latitud}, ${station.longitud}`} />
              <InfoRow icon={Mountain} label="Altitud" value={`${station.altitud} m s.n.m.`} />
              <InfoRow icon={Calendar} label="Instalación" value={formatDate(`${station.fechaInstalacion}T08:00:00-05:00`)} />
              <InfoRow icon={Calendar} label="Última actualización" value={formatDate(station.ultimaActualizacion)} />
              <InfoRow icon={Calendar} label="Mediciones registradas" value={String(station.cantidadMediciones)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mapa</CardTitle>
              <CardDescription>Vista cartográfica — placeholder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <MapPin className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Mapa interactivo</p>
                <p className="mt-1 font-mono text-[10px] text-slate-400">
                  {station.latitud.toFixed(4)}, {station.longitud.toFixed(4)}
                </p>
                <Link
                  href="/mapa"
                  className="mt-3 text-xs font-medium text-cyan-700 hover:text-cyan-800"
                >
                  Abrir en mapa GIS →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de campañas</CardTitle>
          <CardDescription>Campañas simuladas asociadas al río y cuenca de la estación</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Código</th>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Inicio</th>
                <th className="px-5 py-3 font-semibold">Fin</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Muestras</th>
              </tr>
            </thead>
            <tbody>
              {campanas.map((campana) => (
                <tr key={campana.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs">{campana.codigo}</td>
                  <td className="px-5 py-3">{campana.nombre}</td>
                  <td className="px-5 py-3 text-slate-600">{formatShortDate(campana.fechaInicio)}</td>
                  <td className="px-5 py-3 text-slate-600">{formatShortDate(campana.fechaFin)}</td>
                  <td className="px-5 py-3 text-xs">{ESTADO_CAMPANA_LABELS[campana.estado]}</td>
                  <td className="px-5 py-3 font-semibold">{campana.muestrasEnEstacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {parameters.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Parámetros registrados
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {parameters.map((param) => (
              <ParameterCard key={param.key} param={param} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Gráficos históricos
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HistoricalChart
            title="pH"
            unit="—"
            color="#0891b2"
            data={mediciones
              .filter((m): m is typeof m & { ph: number } => m.ph !== undefined)
              .map((m) => ({ fecha: m.fecha, value: m.ph }))}
          />
          <HistoricalChart
            title="Oxígeno disuelto"
            unit="mg/L"
            color="#059669"
            data={mediciones
              .filter(
                (m): m is typeof m & { oxigenoDisuelto: number } =>
                  m.oxigenoDisuelto !== undefined
              )
              .map((m) => ({ fecha: m.fecha, value: m.oxigenoDisuelto }))}
          />
          <HistoricalChart
            title="Turbidez"
            unit="NTU"
            color="#d97706"
            data={mediciones
              .filter((m): m is typeof m & { turbidez: number } => m.turbidez !== undefined)
              .map((m) => ({ fecha: m.fecha, value: m.turbidez }))}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clasificación ECA</CardTitle>
            <CardDescription>Evaluación simulada según normativa orientativa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ComplianceBadge
              status={station.clasificacionEca}
              label={getComplianceLabel(station.clasificacionEca)}
            />
            {parametrosViolados.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-red-600">Parámetros violados</p>
                <p className="mt-1 text-sm text-slate-600">{parametrosViolados.join(", ")}</p>
              </div>
            )}
            {parametrosEnAlerta.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-amber-600">Parámetros en alerta</p>
                <p className="mt-1 text-sm text-slate-600">{parametrosEnAlerta.join(", ")}</p>
              </div>
            )}
            {parametrosViolados.length === 0 && parametrosEnAlerta.length === 0 && (
              <p className="text-sm text-slate-500">Sin parámetros en incumplimiento ni alerta.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4 text-cyan-600" />
              Índices satelitales simulados
            </CardTitle>
            <CardDescription>
              Fuente: {indicesSatelitales.fuente} · {formatShortDate(indicesSatelitales.fechaAdquisicion)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <IndexValue label="NDWI" value={indicesSatelitales.ndwi} />
              <IndexValue label="NDVI" value={indicesSatelitales.ndvi} />
              <IndexValue label="MNDWI" value={indicesSatelitales.mndwi} />
              <IndexValue label="NDTI" value={indicesSatelitales.ndti} />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Cobertura nubosa: {indicesSatelitales.coberturaNubosa}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function IndexValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-mono text-lg font-bold text-slate-900">{value.toFixed(3)}</p>
    </div>
  );
}
