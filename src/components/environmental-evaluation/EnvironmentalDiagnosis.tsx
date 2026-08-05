import { Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EnvironmentalDiagnosisResult } from "@/types/environmental-evaluation";

interface EnvironmentalDiagnosisProps {
  diagnosis: EnvironmentalDiagnosisResult;
}

export function EnvironmentalDiagnosis({ diagnosis }: EnvironmentalDiagnosisProps) {
  return (
    <Card className="border-cyan-200/80">
      <CardHeader className="border-b border-cyan-100 bg-cyan-50/40">
        <CardTitle className="flex items-center gap-2 text-base text-cyan-900">
          <Brain className="h-5 w-5" />
          Evaluación automática
        </CardTitle>
        <CardDescription>
          Motor de diagnóstico simulado · Confianza {(diagnosis.nivelConfianza * 100).toFixed(0)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-sm leading-relaxed text-slate-700">{diagnosis.mensaje}</p>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Reglas aplicadas
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {diagnosis.reglasAplicadas.map((rule) => (
              <span
                key={rule}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600"
              >
                {rule}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
