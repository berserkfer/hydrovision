"use client";

import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, Satellite, TrendingUp, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useDrenPrediction,
  isPredictionOk,
  isPredictionLiteratureModel,
  isPredictionInsufficient,
} from "@/hooks/useDrenPrediction";

const DEFAULT_PARAMETER = "total_suspended_solids";
const DEFAULT_PARAMETER_LABEL = "Sólidos Suspendidos Totales (SST)";

function MiniStep({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {done ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      ) : (
        <XCircle className="h-3 w-3 text-slate-400" />
      )}
      <span className={done ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </div>
  );
}

interface StationPredictionCardProps {
  /** id de dominio de la estación real (ej. "dren-4000-p5") */
  domainId: string;
}

/**
 * Predicción satelital con IA para la estación real seleccionada en el mapa — reutiliza
 * useDrenPrediction (misma fuente que el Dashboard y /prediccion, sin duplicar lógica).
 */
export function StationPredictionCard({ domainId }: StationPredictionCardProps) {
  const { scenes, observations, prediction, trend, loading } = useDrenPrediction(
    domainId,
    DEFAULT_PARAMETER
  );

  const predictionOk = isPredictionOk(prediction) ? prediction : null;
  const predictionLiterature = isPredictionLiteratureModel(prediction) ? prediction : null;
  const predictionInsufficient = isPredictionInsufficient(prediction) ? prediction : null;

  const step1Done = !!scenes && scenes.scenes.length > 0;
  const step2Done = !!observations && observations.observations.length > 0;
  const step3Done = predictionOk !== null || predictionLiterature !== null;

  return (
    <Card className="border-cyan-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan-600" />
          <CardTitle className="text-sm">Predicción Satelital con IA</CardTitle>
        </div>
        <CardDescription className="text-[11px]">
          Copernicus/Sentinel-2 → índices → {DEFAULT_PARAMETER_LABEL}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {loading && !scenes && !observations && !prediction ? (
          <p className="text-slate-400">Consultando…</p>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Satellite className="h-3 w-3 text-slate-400" />
              <MiniStep done={step1Done} label="Escena" />
              <MiniStep done={step2Done} label="Índices" />
              <MiniStep done={step3Done} label="Predicción" />
            </div>

            {predictionOk ? (
              <p className="font-mono text-lg font-bold text-slate-900">
                {predictionOk.predictedValue}{" "}
                <span className="text-[11px] font-normal text-slate-400">{predictionOk.unit}</span>
              </p>
            ) : predictionLiterature ? (
              <div>
                <span className="inline-flex w-fit items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
                  Ref. bibliográfica — no local
                </span>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {predictionLiterature.predictedValue}{" "}
                  <span className="text-[11px] font-normal text-slate-400">{predictionLiterature.unit}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  {predictionLiterature.literatureModel.citation.authors} (
                  {predictionLiterature.literatureModel.citation.year})
                </p>
              </div>
            ) : predictionInsufficient ? (
              <div>
                <p className="font-semibold text-amber-700">{predictionInsufficient.status}</p>
                <p className="text-slate-500">
                  N real: {predictionInsufficient.sampleSize.realPairs} pares campo-satélite
                </p>
              </div>
            ) : null}

            {trend?.status === "TREND_AVAILABLE" && trend.forecast ? (
              <div className="flex items-center gap-1.5 text-amber-700">
                <TrendingUp className="h-3 w-3" />
                Proyección: {trend.forecast.predictedValue} al {trend.forecast.targetDate}
              </div>
            ) : trend ? (
              <p className="text-slate-500">
                Proyección insuficiente ({trend.totalRecordsFound} registro(s) real(es))
              </p>
            ) : null}
          </>
        )}

        <Link
          href="/prediccion"
          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-900"
        >
          Ver predicción completa <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
