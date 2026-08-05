import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EnvironmentalRecommendationItem } from "@/types/environmental-evaluation";
import { cn } from "@/lib/utils";

interface EnvironmentalRecommendationsProps {
  recommendations: EnvironmentalRecommendationItem[];
}

const PRIORITY_STYLES = {
  baja: "border-slate-200 bg-slate-50",
  media: "border-amber-200 bg-amber-50/50",
  alta: "border-red-200 bg-red-50/50",
};

const PRIORITY_LABELS = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export function EnvironmentalRecommendations({ recommendations }: EnvironmentalRecommendationsProps) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Recomendaciones
        </CardTitle>
        <CardDescription>Acciones sugeridas según el estado detectado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={cn(
              "rounded-lg border px-4 py-3",
              PRIORITY_STYLES[rec.prioridad]
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700">{rec.texto}</p>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">
                {PRIORITY_LABELS[rec.prioridad]}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
