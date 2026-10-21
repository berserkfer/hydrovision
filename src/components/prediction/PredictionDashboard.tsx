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
import { DataTag } from "@/components/ui/DataTag";
import { DREN_4000_POINTS, DREN_4000_RIO_ID } from "@/data/mock/dren-4000-real-data";
import {
  isPredictionInsufficient,
  isPredictionLiteratureModel,
  isPredictionOk,
  useDrenPrediction,
  type PredictionOk,
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
    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--hv-ink)]">
      {ok === null ? (
        <span className="h-3.5 w-3.5 animate-pulse rounded-full border border-slate-300" />
      ) : ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.6} />
      ) : (
        <XCircle className="h-4 w-4 text-amber-600" strokeWidth={1.6} />
      )}
      <span>{label}</span>
    </div>
  );
}

function WaterPixelQuality({
  observation,
}: {
  observation: {
    provider?: string;
    waterFraction?: number | null;
    pixelsUsed?: number;
    waterSufficiency?: "sufficient" | "insufficient" | "unknown";
  };
}) {
  if (observation.waterFraction == null && observation.waterSufficiency !== "insufficient") {
    // Solo el respaldo de Copernicus no calcula la fracción de agua: ahí la regla f_agua ≥ 0,5
    // no se pudo verificar y se dice explícitamente. Con Planetary (principal) la regla sí se
    // aplica; si aun así no hay fracción, no hay nada que mostrar.
    if (observation.provider !== "copernicus") return null;
    return (
      <p className="mt-3 flex items-start gap-2 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
        <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500" aria-hidden />
        Escena del respaldo Copernicus: la fracción de agua no se verificó y la regla f_agua ≥ 0,5
        no se aplicó a esta escena.
      </p>
    );
  }

  const percent =
    observation.waterFraction == null ? null : Math.round(observation.waterFraction * 100);
  const insufficient = observation.waterSufficiency === "insufficient";

  return (
    <div
      className={cn(
        "mt-3 rounded-[3px] border px-3 py-2 text-xs leading-relaxed",
        insufficient
          ? "border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)]"
          : "border-[var(--hv-border)] text-[var(--hv-foreground-muted)]"
      )}
    >
      <p className="hv-eyebrow text-[9.5px]">Píxeles de agua · ventana 3×3</p>
      <p className="mt-1">
        <span className="hv-num text-[13px] text-[var(--hv-ink)]">
          {percent === null ? "desconocido" : `${percent}%`}
        </span>
        {observation.pixelsUsed != null ? ` · ${observation.pixelsUsed} píxeles válidos` : ""}
      </p>
      {insufficient && (
        <p className="mt-1.5 flex items-start gap-2 font-medium">
          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500" aria-hidden />
          Advertencia: no hay píxeles de agua suficientes; la estimación no debería usarse.
        </p>
      )}
    </div>
  );
}

/** R² agrupado leave-one-date-out: la métrica de generalización temporal del modelo. */
function CrossValidationReadout({
  cv,
}: {
  cv: PredictionOk["model"]["crossValidation"];
}) {
  if (!cv) {
    return (
      <p className="text-[11px] text-[var(--hv-foreground-dim)]">
        Validación cruzada por fecha no disponible para este modelo.
      </p>
    );
  }
  return (
    <div className="rounded-[3px] border border-[var(--hv-border)] px-3 py-2 text-[11px] leading-relaxed text-[var(--hv-foreground-muted)]">
      <p className="hv-eyebrow text-[9.5px]">R² agrupado · leave-one-date-out</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="hv-num text-[20px] font-light text-[var(--hv-ink)]">
          {cv.pooledR2 ?? "—"}
        </span>
        {cv.r2Ci95 ? (
          <span className="hv-num">
            IC 95 % [{cv.r2Ci95.lower}, {cv.r2Ci95.upper}]
          </span>
        ) : (
          <span>sin intervalo (N fuera de muestra &lt; 5)</span>
        )}
      </p>
      <p className="hv-num mt-1">
        N fuera de muestra={cv.pooledN} · {cv.evaluatedFolds} fechas · RMSE={cv.pooledRmse ?? "—"} · MAE=
        {cv.pooledMae ?? "—"}
      </p>
      <p className="mt-1 text-[var(--hv-foreground-dim)]">
        Complemento por fecha: R² medio {cv.meanR2PerDate ?? "—"}
        {cv.sdR2PerDate !== null ? ` ± ${cv.sdR2PerDate}` : ""} (inestable con pocos puntos por fecha).
      </p>
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
          <Satellite className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.5} />
          <h3 className="hv-eyebrow">Predicción satelital — Dren 4000</h3>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--hv-foreground-muted)]">
          Un solo flujo: consulta Copernicus/Sentinel-2 → índices espectrales → predicción, más
          serie histórica real y proyección a corto plazo. Todo bajo el mismo techo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="hv-eyebrow flex items-center text-[10px]">
          Punto de monitoreo
          <select
            className="ml-2 rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2.5 py-1.5 text-sm normal-case tracking-normal text-[var(--hv-foreground)]"
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

        <label className="hv-eyebrow flex items-center text-[10px]">
          Parámetro
          <select
            className="ml-2 rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2.5 py-1.5 text-sm normal-case tracking-normal text-[var(--hv-foreground)]"
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
              <>
                <ul className="space-y-1">
                  {Object.entries(observations.observations[0].indices).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}</span>
                      <span className="hv-num text-[var(--hv-ink)]">{v.toFixed(3)}</span>
                    </li>
                  ))}
                </ul>
                <WaterPixelQuality observation={observations.observations[0]} />
              </>
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
                <p className="text-[34px] font-light leading-none tracking-[-0.02em] text-[var(--hv-ink)] tabular-nums">
                  {predictionOk.predictedValue}{" "}
                  <span className="text-sm font-normal text-slate-400">{predictionOk.unit}</span>
                </p>
                {predictionOk.uncertainty && (
                  <p className="text-xs text-slate-500">
                    Banda: {predictionOk.uncertainty.lower} – {predictionOk.uncertainty.upper} ({predictionOk.uncertainty.method})
                  </p>
                )}
                <div className="hv-num rounded-[3px] border border-[var(--hv-border)] px-3 py-2 text-[11px] leading-relaxed text-[var(--hv-foreground-muted)]">
                  <p>N entrenamiento: {predictionOk.model.trainingSampleCount} · N validación: {predictionOk.model.validationSampleCount}</p>
                  <p>
                    R²={predictionOk.model.validationMetrics.r2} · RMSE={predictionOk.model.validationMetrics.rmse} · MAE=
                    {predictionOk.model.validationMetrics.mae}
                  </p>
                </div>
                <CrossValidationReadout cv={predictionOk.model.crossValidation} />
              </>
            ) : predictionLiterature ? (
              <>
                <DataTag tone="caution">Modelo bibliográfico — no calibrado localmente</DataTag>
                <p className="mt-2 text-[34px] font-light leading-none tracking-[-0.02em] text-[var(--hv-ink)] tabular-nums">
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
                <div className="hv-num rounded-[3px] border border-[var(--hv-border)] px-3 py-2 text-[11px] leading-relaxed text-[var(--hv-foreground-muted)]">
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
                <DataTag tone="caution">{predictionInsufficient.status}</DataTag>
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
            <TrendingUp className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.5} />
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
                    <CartesianGrid strokeDasharray="2 4" stroke="#e0dcd1" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#959aa3" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#959aa3" />
                    <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e0dcd1", background: "#fbfaf6", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="valor" name="Real" stroke="#0f2347" strokeWidth={1.6} dot={{ r: 3.5, fill: "#0f2347", strokeWidth: 0 }} connectNulls={false} />
                    {trend.forecast && (
                      <ReferenceDot
                        x={trend.forecast.targetDate}
                        y={trend.forecast.predictedValue}
                        r={5}
                        fill="#93661a"
                        stroke="none"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--hv-border)] bg-[var(--hv-border)] text-xs sm:grid-cols-4">
                <div className="bg-[var(--hv-surface)] px-3 py-2">
                  <p className="hv-eyebrow text-[9.5px]">Pendiente/año</p>
                  <p className="hv-num mt-1 text-[13px] text-[var(--hv-ink)]">{trend.trend?.slopePerYear}</p>
                </div>
                <div className="bg-[var(--hv-surface)] px-3 py-2">
                  <p className="hv-eyebrow text-[9.5px]">R²</p>
                  <p className="hv-num mt-1 text-[13px] text-[var(--hv-ink)]">{trend.trend?.metrics.r2}</p>
                </div>
                <div className="bg-[var(--hv-surface)] px-3 py-2">
                  <p className="hv-eyebrow text-[9.5px]">RMSE</p>
                  <p className="hv-num mt-1 text-[13px] text-[var(--hv-ink)]">{trend.trend?.metrics.rmse}</p>
                </div>
                <div className="bg-[var(--hv-surface)] px-3 py-2">
                  <p className="hv-eyebrow text-[9.5px]">N real</p>
                  <p className="hv-num mt-1 text-[13px] text-[var(--hv-ink)]">{trend.totalRecordsFound}</p>
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
            <div className={cn("rounded-[3px] border px-4 py-3 text-sm", "border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)]")}>
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
