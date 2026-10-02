"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  isEnvironmentalModelOk,
  useEnvironmentalModel,
  type EnvironmentalWaterMatrix,
} from "@/hooks/useEnvironmentalModel";

const MATRIX_OPTIONS: { value: EnvironmentalWaterMatrix; label: string; hint: string }[] = [
  { value: "agua_residual", label: "Agua residual (P1–P5)", hint: "Dentro del Dren 4000" },
  { value: "agua_marina", label: "Agua marina (P6–P10)", hint: "Desembocadura / orilla" },
];

/** Debe reflejar environmental-parameters.config.ts — duplicado a propósito para no importar
 *  código de servidor en un componente cliente (mismo patrón que PARAMETER_OPTIONS en
 *  PredictionDashboard.tsx). */
const TARGET_OPTIONS_BY_MATRIX: Record<EnvironmentalWaterMatrix, { code: string; label: string }[]> = {
  agua_residual: [
    { code: "temperature", label: "Temperatura" },
    { code: "ph", label: "pH" },
    { code: "conductivity", label: "Conductividad" },
    { code: "total_suspended_solids", label: "Sólidos Suspendidos Totales" },
    { code: "bod5", label: "DBO5" },
    { code: "coliforms", label: "Coliformes Totales" },
    { code: "thermotolerant_coliforms", label: "Coliformes Termotolerantes" },
  ],
  agua_marina: [
    { code: "temperature", label: "Temperatura" },
    { code: "ph", label: "pH" },
    { code: "conductivity", label: "Conductividad" },
    { code: "total_suspended_solids", label: "Sólidos Suspendidos Totales" },
    { code: "bod5", label: "DBO5" },
    { code: "coliforms", label: "Coliformes Totales" },
    { code: "thermotolerant_coliforms", label: "Coliformes Termotolerantes" },
    { code: "nitrates", label: "Nitratos" },
    { code: "phosphates", label: "Fosfatos" },
  ],
};

export function EnvironmentalModelPanel() {
  const [matrix, setMatrix] = useState<EnvironmentalWaterMatrix>("agua_residual");
  const [targetCode, setTargetCode] = useState("bod5");

  const targetOptions = TARGET_OPTIONS_BY_MATRIX[matrix];
  const effectiveTarget = useMemo(
    () => (targetOptions.some((t) => t.code === targetCode) ? targetCode : targetOptions[0].code),
    [targetOptions, targetCode]
  );

  const { data, loading } = useEnvironmentalModel(matrix, effectiveTarget);
  const ok = isEnvironmentalModelOk(data) ? data : null;
  const insufficient = data && !isEnvironmentalModelOk(data) ? data : null;

  return (
    <Card className="border-amber-200/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">Modelo Ambiental — Dren 4000 (sin satélite)</CardTitle>
        </div>
        <CardDescription>
          Predice un parámetro a partir de OTROS parámetros medidos en la misma muestra.
          Dataset histórico: Nizama Pacheco &amp; Cabrera Carranza (2018) — 2 campañas, 2014,
          anteriores a Sentinel-2. <strong>Independiente</strong> del módulo de predicción
          satelital (Sentinel-2 + SST) que se muestra arriba — no comparten datos ni resultados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--hv-foreground-muted)]">
            Matriz de agua
            <select
              className="ml-2 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface)] px-3 py-1.5 text-sm"
              value={matrix}
              onChange={(e) => setMatrix(e.target.value as EnvironmentalWaterMatrix)}
            >
              {MATRIX_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.hint}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-[var(--hv-foreground-muted)]">
            Parámetro objetivo
            <select
              className="ml-2 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface)] px-3 py-1.5 text-sm"
              value={effectiveTarget}
              onChange={(e) => setTargetCode(e.target.value)}
            >
              {targetOptions.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {loading && <span className="text-xs text-[var(--hv-foreground-dim)]">Calculando…</span>}
        </div>

        {ok ? (
          <>
            <div className="rounded-lg bg-[var(--hv-surface-secondary)] px-3 py-2 text-xs text-[var(--hv-foreground-muted)]">
              N real disponible: <strong>{ok.n}</strong> muestras · máximo de predictores
              simultáneos permitido: <strong>{ok.maxSimultaneousPredictorsAllowed}</strong>{" "}
              (modelo multivariante requeriría N≥{ok.multivariate.requiredNFor2Predictors} —
              deshabilitado)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--hv-border)] text-xs uppercase tracking-wide text-[var(--hv-foreground-dim)]">
                    <th className="py-2 pr-4">Predictor</th>
                    <th className="py-2 pr-4">N</th>
                    <th className="py-2 pr-4">R²</th>
                    <th className="py-2 pr-4">RMSE</th>
                    <th className="py-2 pr-4">MAE</th>
                    <th className="py-2 pr-4">Ecuación</th>
                  </tr>
                </thead>
                <tbody>
                  {ok.fits.map((fit) => (
                    <tr key={fit.predictorCode} className="border-b border-[var(--hv-border)]/50">
                      <td className="py-2 pr-4">{fit.predictorLabel}</td>
                      <td className="py-2 pr-4 font-mono">{fit.n}</td>
                      {fit.sufficientData ? (
                        <>
                          <td className="py-2 pr-4 font-mono">{fit.metrics.r2}</td>
                          <td className="py-2 pr-4 font-mono">{fit.metrics.rmse}</td>
                          <td className="py-2 pr-4 font-mono">{fit.metrics.mae}</td>
                          <td className="py-2 pr-4 font-mono text-xs text-[var(--hv-foreground-dim)]">
                            y = {fit.coefficientA} + {fit.coefficientB}·x
                          </td>
                        </>
                      ) : (
                        <td className="py-2 pr-4 text-amber-700" colSpan={4}>
                          Datos insuficientes (N={fit.n})
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 rounded-lg border border-amber-200/60 bg-amber-500/5 p-3 text-xs text-[var(--hv-foreground-muted)]">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                <Info className="h-3.5 w-3.5" /> Advertencias — léelas antes de usar cualquier
                valor
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {ok.disclaimers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </>
        ) : insufficient ? (
          <div className="rounded-lg border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-semibold text-amber-800">{insufficient.status}</p>
            <p className="mt-1 text-[var(--hv-foreground-muted)]">{insufficient.message}</p>
            <p className="mt-1 text-xs text-[var(--hv-foreground-dim)]">
              N real disponible: {insufficient.n}
            </p>
          </div>
        ) : !loading ? (
          <p className="text-sm text-[var(--hv-foreground-dim)]">Cargando…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
