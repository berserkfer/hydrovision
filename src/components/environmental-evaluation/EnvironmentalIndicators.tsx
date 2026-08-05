import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { getComplianceLabel } from "@/lib/eca/classifier";
import type { EnvironmentalIndicatorCard } from "@/types/environmental-evaluation";

interface EnvironmentalIndicatorsProps {
  indicators: EnvironmentalIndicatorCard[];
}

export function EnvironmentalIndicators({ indicators }: EnvironmentalIndicatorsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {indicators.map((indicator) => (
        <Card key={indicator.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {indicator.label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{indicator.value}</p>
            <p className="mt-1 text-xs text-slate-500">{indicator.subtitle}</p>
            <div className="mt-3 flex items-center justify-between">
              <TrendIcon trend={indicator.trend} />
              {indicator.status !== "neutral" ? (
                <ComplianceBadge
                  status={indicator.status}
                  label={getComplianceLabel(indicator.status)}
                />
              ) : (
                <span className="text-[10px] text-slate-400">Simulado</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendIcon({ trend }: { trend: EnvironmentalIndicatorCard["trend"] }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up" ? "text-amber-600" : trend === "down" ? "text-red-600" : "text-slate-400";
  return <Icon className={`h-4 w-4 ${color}`} aria-label={`Tendencia ${trend}`} />;
}
