"use client";

import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Database,
  Droplets,
  MapPin,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { Indicator } from "@/types/indicators";
import { TRAFFIC_LIGHT_COLORS } from "@/services/indicators";
import { cn } from "@/lib/utils";

const ICONS = {
  droplets: Droplets,
  shield: Shield,
  alert: AlertTriangle,
  trend: TrendingUp,
  "map-pin": MapPin,
  clipboard: ClipboardList,
  database: Database,
  activity: Activity,
};

interface IndicatorCardProps {
  indicator: Indicator;
}

function MiniTrendChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-90" aria-hidden="true">
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

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const Icon = ICONS[indicator.icon];

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md hv-animate-fade-in">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="rounded-xl p-2.5 transition-colors"
              style={{ backgroundColor: `${indicator.color}18`, color: indicator.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm leading-snug">{indicator.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 text-[11px]">
                {indicator.description}
              </CardDescription>
            </div>
          </div>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white"
            style={{ backgroundColor: TRAFFIC_LIGHT_COLORS[indicator.trafficLight] }}
            title={`Semáforo: ${indicator.statusLabel}`}
            aria-label={`Semáforo ambiental ${indicator.statusLabel}`}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {indicator.displayValue}
              <span className="ml-1 text-sm font-normal text-slate-400">{indicator.unit}</span>
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: indicator.color }}>
              {indicator.statusLabel} · {indicator.score}/100
            </p>
          </div>
          <MiniTrendChart data={indicator.trend} color={indicator.color} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Puntuación</span>
            <span>{indicator.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${indicator.progressPercent}%`,
                backgroundColor: indicator.color,
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-semibold uppercase",
              indicator.importance === "critical"
                ? "bg-red-100 text-red-700"
                : indicator.importance === "high"
                  ? "bg-orange-100 text-orange-700"
                  : indicator.importance === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
            )}
          >
            {indicator.importance === "critical"
              ? "Crítico"
              : indicator.importance === "high"
                ? "Alta"
                : indicator.importance === "medium"
                  ? "Media"
                  : "Baja"}{" "}
            importancia
          </span>
          <span>{formatDate(indicator.updatedAt).split(",")[0]}</span>
        </div>
      </CardContent>
    </Card>
  );
}
