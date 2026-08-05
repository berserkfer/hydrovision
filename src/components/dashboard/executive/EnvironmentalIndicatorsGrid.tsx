"use client";

import {
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveParameterCard } from "@/types/executive";
import { cn } from "@/lib/utils";

const ICONS = {
  ph: Droplets,
  oxygen: Wind,
  temperature: Thermometer,
  conductivity: Activity,
  turbidity: Waves,
  flow: Gauge,
};

interface EnvironmentalIndicatorsGridProps {
  cards: ExecutiveParameterCard[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-80" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function EnvironmentalIndicatorsGrid({ cards }: EnvironmentalIndicatorsGridProps) {
  return (
    <section className="hv-animate-fade-in space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Indicadores ambientales
        </h2>
        <p className="text-xs text-slate-400">Promedio cuenca · Tendencia simulada</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = ICONS[card.icon];
          const sparkColor =
            card.status === "non_compliant"
              ? "#ef4444"
              : card.status === "alert"
                ? "#f59e0b"
                : "#0891b2";

          return (
            <Card
              key={card.key}
              className="overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{card.label}</CardTitle>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      card.statusColorClass
                    )}
                  >
                    {card.statusLabel}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {card.value}
                      <span className="ml-1 text-sm font-normal text-slate-400">{card.unit}</span>
                    </p>
                    <p className={cn("mt-1 text-xs font-medium", card.trendColorClass)}>
                      {card.trendSymbol}{" "}
                      {card.variationPercent > 0 ? "+" : ""}
                      {card.variationPercent}% vs monitoreo anterior
                    </p>
                  </div>
                  <MiniSparkline data={card.sparkline} color={sparkColor} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
