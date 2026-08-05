"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Satellite } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { IndexDashboardItem } from "@/services/satellite-index-engine";
import { cn } from "@/lib/utils";

interface SatelliteIndicesSectionProps {
  items: IndexDashboardItem[];
  riverName: string;
}

function ColorScaleBar({
  colorScale,
  value,
}: {
  colorScale: IndexDashboardItem["colorScale"];
  value: number;
}) {
  if (colorScale.length === 0) return null;

  const gradient = colorScale.map((stop) => stop.color).join(", ");

  return (
    <div className="space-y-1">
      <div
        className="h-2 w-full rounded-full"
        style={{ background: `linear-gradient(to right, ${gradient})` }}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{colorScale[0]?.value.toFixed(2)}</span>
        <span className="font-mono text-slate-600">{value.toFixed(3)}</span>
        <span>{colorScale[colorScale.length - 1]?.value.toFixed(2)}</span>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: IndexDashboardItem["temporal"]["trend"] }) {
  if (trend === "up") return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <ArrowRight className="h-3.5 w-3.5" />;
}

export function SatelliteIndicesSection({ items, riverName }: SatelliteIndicesSectionProps) {
  return (
    <section className="hv-animate-fade-in space-y-3">
      <div className="flex items-center gap-2">
        <Satellite className="h-4 w-4 text-cyan-600" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Índices Satelitales
          </h2>
          <p className="text-xs text-slate-400">
            {riverName} · Motor simulado · NDWI · NDVI · MNDWI · NDTI · NDMI
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.definition.code} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{item.definition.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {item.definition.description}
                  </CardDescription>
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: item.interpretation.color }}
                >
                  {item.interpretation.statusLabel}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {item.result.value.toFixed(3)}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {item.definition.unit}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{item.interpretation.message}</p>
                </div>
                <div
                  className="h-10 w-10 rounded-lg ring-2 ring-white"
                  style={{ backgroundColor: item.interpretation.color }}
                  aria-hidden
                />
              </div>

              <ColorScaleBar colorScale={item.colorScale} value={item.result.value} />

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">Fórmula:</span>{" "}
                  {item.definition.formula}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-700">Bandas:</span>{" "}
                  {item.definition.bands.join(" · ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-white p-2 text-[11px]">
                <div>
                  <p className="text-slate-400">Valor anterior</p>
                  <p className="font-mono font-semibold text-slate-800">
                    {item.temporal.previousValue.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Variación</p>
                  <p
                    className={cn(
                      "flex items-center gap-0.5 font-semibold",
                      item.temporal.trend === "up"
                        ? "text-emerald-600"
                        : item.temporal.trend === "down"
                          ? "text-red-600"
                          : "text-slate-600"
                    )}
                  >
                    <TrendIcon trend={item.temporal.trend} />
                    {item.temporal.variation > 0 ? "+" : ""}
                    {item.temporal.variation.toFixed(3)} ({item.temporal.variationPercent}%)
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-medium text-slate-500">{item.temporal.trendLabel}</p>

              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">Leyenda</p>
                <div className="flex flex-wrap gap-1">
                  {item.legend.map((entry, index) => (
                    <span
                      key={`${item.definition.code}-legend-${index}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.label} ({entry.range})
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
