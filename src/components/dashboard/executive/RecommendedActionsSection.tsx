"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveAction } from "@/types/executive";
import { cn } from "@/lib/utils";

interface RecommendedActionsSectionProps {
  actions: ExecutiveAction[];
}

export function RecommendedActionsSection({ actions }: RecommendedActionsSectionProps) {
  return (
    <section className="hv-animate-fade-in space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Acciones recomendadas
        </h2>
        <p className="text-xs text-slate-400">Generadas según nivel de riesgo ambiental</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Plan de acción sugerido
          </CardTitle>
          <CardDescription>Priorizadas para toma de decisiones</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <ol className="space-y-3">
            {actions.map((action, index) => (
              <li
                key={action.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{action.text}</p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      action.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : action.priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {action.priority === "high"
                      ? "Alta prioridad"
                      : action.priority === "medium"
                        ? "Media prioridad"
                        : "Baja prioridad"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
