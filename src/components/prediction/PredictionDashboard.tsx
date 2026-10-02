"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CloudOff, Satellite, TrendingUp, XCircle } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { DREN_4000_POINTS, DREN_4000_RIO_ID } from "@/data/mock/dren-4000-real-data";
import {
  isPredictionInsufficient,
  isPredictionLiteratureModel,
  isPredictionOk,
  useDrenPrediction,
} from "@/hooks/useDrenPrediction";

const PARAMETER_OPTIONS: { code: string; label: string; unit: string }[] = [
  { code: "total_suspended_solids", label: "Sólidos Suspendidos Totales (SST)", unit: "mg/L" },
  { code: "turbidity", label: "Turbidez", unit: "NTU" },
  { code: "ph", label: "pH", unit: "" },
  { code: "temperature", label: "Temperatura", unit: "°C" },
  { code: "conductivity", label: "Conductividad", unit: "µS/cm" },
  { code: "coliforms", label: "Coliformes Totales", unit: "NMP/100mL" },
  { code: "thermotolerant_coliforms", label: "Coliformes Termotolerantes", unit: "NMP/100mL" },
  { code: "bod5", label: "DBO5", unit: "mg/L" },
  { code: "nitrates", label: "Nitratos", unit: "mg/L" },
  { code: "phosphates", label: "Fosfatos", unit: "mg/L" },
];

export const DREN_4000_STATIONS = DREN_4000_POINTS.map((p) => ({
  id: `${DREN_4000_RIO_ID}-${p.codigo.toLowerCase()}`,
  codigo: p.codigo,
  nombre: p.nombre,
}));

function StepBadge({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      {ok === null ? (
        <span className="h-4 w-4 animate-pulse rounded-full bg-slate-300" />
      ) : ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 text-amber-600" />
      )}
      <span>{label}</span>
    </div>
  );
}

export function PredictionDashboard() {
  const [stationId, setStationId] = useState(DREN_4000_STATIONS[4]?.id ?? DREN_4000_STATIONS[0].id); // P5 por defecto
  const [parameterCode, setParameterCode] = useState("total_suspended_solids");

  const { scenes, observations, prediction, trend, loading } = useDrenPrediction(stationId, parameterCode);

  const parameterLabel = useMemo(
    () => PARAMETER_OPTIONS.find((p) => p.code === parameterCode)?.label ?? parameterCode,
    [parameterCode]
  );

  const predictionOk = isPredictionOk(prediction) ? prediction : null;
  const predictionLiterature = isPredictionLiteratureModel(prediction) ? prediction : null;
  const predictionInsufficient = isPredictionInsufficient(prediction) ? prediction : null;
  const predictedOk = prediction ? predictionOk !== null || predictionLiterature !== null : null;

  const chartData = useMemo(() => {
    if (!trend || trend.points.length === 0) return [];
    const historical = trend.points.map((p) => ({
      date: p.date.slice(0, 10),
      valor: p.value,
      proyeccion: undefined as number | undefined,
    }));
    if (trend.forecast) {
      historical.push({
        date: trend.forecast.targetDate,
        valor: undefined as unknown as number,
        proyeccion: trend.forecast.predictedValue,
      });
    }
    return historical;
  }, [trend]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Satellite className="h-5 w-5 text-cyan-600" />
          <h1 className="text-xl font-bold text-slate-900">Predicción Satelital — Dren 4000</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Un solo flujo: consulta Copernicus/Sentinel-2 → índices espectrales → predicción, más
          serie histórica real y proyección a corto plazo. Todo bajo el mismo techo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          Punto de monitoreo
          <select
            className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
          >
            {DREN_4000_STATIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} — {s.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-600">
          Parámetro
          <select
            className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            value={parameterCode}
            onChange={(e) => setParameterCode(e.target.value)}
          >
            {PARAMETER_OPTIONS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {loading && <span className="text-xs text-slate-400">Consultando…</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Paso 1 */}
        <Card>
          <CardHeader>
            <StepBadge ok={scenes ? scenes.scenes.length > 0 : null} label="Paso 1 · Consulta Copernicus/Sentinel-2" />
            <CardDescription>Búsqueda de escenas Sentinel-2 L2A para este punto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {scenes && scenes.scenes.length > 0 ? (
              <>
                <p>
                  Última escena: <strong>{scenes.scenes[0].acquisitionDate}</strong> · nubosidad{" "}
                  {scenes.scenes[0].cloudPercentage ?? "?"}%
                </p>
                <p className="text-xs text-slate-500">{scenes.meta.message}</p>
              </>
            ) : (
              <div className="flex items-start gap-2 text-slate-500">
                <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Sin escenas disponibles para este punto todavía. Este punto no tiene datos
                  satelitales fabricados — solo aparecerán aquí cuando Copernicus esté configurado
                  con credenciales reales (ver .env.example) y consultado en vivo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paso 2 */}
        <Card>
          <CardHeader>
            <StepBadge ok={observations ? observations.observations.length > 0 : null} label="Paso 2 · Índices espectrales" />
            <CardDescription>NDWI / MNDWI / NDTI / NDCI calculados desde la reflectancia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {observations && observations.observations.length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(observations.observations[0].indices).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono font-semibold">{v.toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">Sin observación satelital reciente para calcular índices.</p>
            )}
          </CardContent>
        </Card>

        {/* Paso 3 */}
        <Card>
          <CardHeader>
            <StepBadge ok={predictedOk} label="Paso 3 · Predicción" />
            <CardDescription>{parameterLabel} estimado desde el índice espectral</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {predictionOk ? (
              <>
                <p className="text-2xl font-bold text-slate-900">
                  {predictionOk.predictedValue}{" "}
                  <span className="text-sm font-normal text-slate-400">{predictionOk.unit}</span>
                </p>
                {predictionOk.uncertainty && (
                  <p className="text-xs text-slate-500">
                    Banda: {predictionOk.uncertainty.lower} – {predictionOk.uncertainty.upper} ({predictionOk.uncertainty.method})
                  </p>
                )}
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p>N entrenamiento: {predictionOk.model.trainingSampleCount} · N validación: {predictionOk.model.validationSampleCount}</p>
                  <p>
                    R²={predictionOk.model.validationMetrics.r2} · RMSE={predictionOk.model.validationMetrics.rmse} · MAE=
                    {predictionOk.model.validationMetrics.mae}
                  </p>
                </div>
              </>
            ) : predictionLiterature ? (
              <>
                <span className="inline-flex w-fit items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Modelo bibliográfico — no calibrado localmente
                </span>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">
                  {predictionLiterature.predictedValue}{" "}
                  <span className="text-sm font-normal text-slate-400">{predictionLiterature.unit}</span>
                </p>
                <p className="text-xs text-slate-500">{predictionLiterature.literatureModel.formulaDescription}</p>
                <p className="text-xs text-slate-500">
                  Fuente: {predictionLiterature.literatureModel.citation.authors} (
                  {predictionLiterature.literatureModel.citation.year}).{" "}
                  {predictionLiterature.literatureModel.citation.journal},{" "}
                  {predictionLiterature.literatureModel.citation.volume}, {predictionLiterature.literatureModel.citation.pages}.
                  DOI: {predictionLiterature.literatureModel.citation.doi}
                </p>
                <p className="text-[11px] text-amber-700">
                  {predictionLiterature.literatureModel.transferabilityWarning}
                </p>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p>
                    Calibración original: N={predictionLiterature.literatureModel.calibrationMetrics.n} · R²=
                    {predictionLiterature.literatureModel.calibrationMetrics.r2} ·{" "}
                    {predictionLiterature.literatureModel.calibrationMetrics.calibratedRangeDescription}
                  </p>
                  <p className="mt-1 text-amber-700">
                    Calibración local Dren 4000: {predictionLiterature.localCalibration.status} — N real=
                    {predictionLiterature.localCalibration.sampleSize.realPairs}
                  </p>
                </div>
              </>
            ) : predictionInsufficient ? (
              <>
                <p className="font-semibold text-amber-700">{predictionInsufficient.status}</p>
                <p className="text-slate-600">{predictionInsufficient.message}</p>
                <p className="text-xs text-slate-400">
                  N real disponible: {predictionInsufficient.sampleSize.realPairs}
                </p>
              </>
            ) : (
              <p className="text-slate-400">Cargando…</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Serie histórica + proyección */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            <CardTitle>Serie histórica real y proyección — {parameterLabel}</CardTitle>
          </div>
          <CardDescription>
            Solo mediciones de campo reales (nunca simuladas). Requiere ≥3 fechas distintas y ≥4
            puntos para calcular tendencia — 2 fechas producirían un &ldquo;ajuste perfecto&rdquo;
            sin significado estadístico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trend?.status === "TREND_AVAILABLE" ? (
            <div className="space-y-3">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="valor" name="Real" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                    {trend.forecast && (
                      <ReferenceDot
                        x={trend.forecast.targetDate}
                        y={trend.forecast.predictedValue}
                        r={5}
                        fill="#d97706"
                        stroke="none"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
                <div>
                  <p className="text-slate-400">Pendiente/año</p>
                  <p className="font-mono font-semibold">{trend.trend?.slopePerYear}</p>
                </div>
                <div>
                  <p className="text-slate-400">R²</p>
                  <p className="font-mono font-semibold">{trend.trend?.metrics.r2}</p>
                </div>
                <div>
                  <p className="text-slate-400">RMSE</p>
                  <p className="font-mono font-semibold">{trend.trend?.metrics.rmse}</p>
                </div>
                <div>
                  <p className="text-slate-400">N real</p>
                  <p className="font-mono font-semibold">{trend.totalRecordsFound}</p>
                </div>
              </div>
              {trend.forecast && (
                <p className="text-xs text-amber-700">
                  Proyección a {trend.forecast.targetDate}: {trend.forecast.predictedValue} (banda{" "}
                  {trend.forecast.uncertainty.lower} – {trend.forecast.uncertainty.upper})
                </p>
              )}
              <p className="text-[11px] text-slate-400">{trend.disclaimer}</p>
            </div>
          ) : trend ? (
            <div className={cn("rounded-lg px-4 py-3 text-sm", "bg-amber-50 text-amber-800")}>
              <p className="font-semibold">Datos insuficientes para tendencia/proyección</p>
              <ul className="mt-1 list-disc pl-5">
                {trend.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-700">
                {trend.totalRecordsFound} registro(s) real(es) encontrado(s) para este punto y
                parámetro. Se necesitan más campañas de muestreo (ideal: ≥2015, para poder además
                emparejar con Sentinel-2 real).
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Cargando…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
