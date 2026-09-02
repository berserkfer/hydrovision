"use client";

import { useTheme } from "@/providers/ThemeProvider";
import type { TimeSeriesPoint } from "@/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getChartTheme } from "@/lib/chart-theme";
import { formatShortDate } from "@/lib/utils";

interface WaterQualityTrendChartProps {
  data: TimeSeriesPoint[];
}

function computeQualityIndex(point: TimeSeriesPoint): number {
  const phScore = Math.max(0, 100 - Math.abs(point.ph - 7) * 15);
  const doScore = Math.min(100, (point.dissolvedOxygen / 8) * 100);
  const turbScore = Math.max(0, 100 - point.turbidity * 2);
  return Math.round((phScore + doScore + turbScore) / 3);
}

export function WaterQualityTrendChart({ data }: WaterQualityTrendChartProps) {
  const { theme } = useTheme();
  const colors = getChartTheme(theme);

  const chartData = data.map((d) => ({
    label: formatShortDate(d.date),
    qualityIndex: computeQualityIndex(d),
  }));

  const first = chartData[0]?.qualityIndex ?? 0;
  const last = chartData[chartData.length - 1]?.qualityIndex ?? 0;
  const delta = last - first;
  const trendLabel =
    delta > 3 ? "Tendencia al alza" : delta < -3 ? "Tendencia a la baja" : "Tendencia estable";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Evolución de la calidad del agua</CardTitle>
            <CardDescription>
              Índice compuesto ejecutivo · no incluye todos los parámetros científicos
            </CardDescription>
          </div>
          <span className="rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--hv-foreground-muted)]">
            {trendLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="qualityGradientTheme" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors.stroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: `1px solid ${colors.tooltipBorder}`,
                  backgroundColor: colors.tooltipBg,
                  color: colors.tooltipText,
                  fontSize: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
                formatter={(value: number) => [`${value}`, "Índice de calidad"]}
              />
              <Area
                type="monotone"
                dataKey="qualityIndex"
                name="Índice de calidad"
                stroke={colors.stroke}
                strokeWidth={2.5}
                fill="url(#qualityGradientTheme)"
                dot={{ r: 3, fill: colors.stroke, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: colors.stroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs text-[var(--hv-foreground-dim)]">
          Análisis detallado de pH, turbidez, conductividad y otros parámetros en{" "}
          <span className="font-medium text-[var(--hv-foreground-muted)]">Parámetros</span> y{" "}
          <span className="font-medium text-[var(--hv-foreground-muted)]">Análisis temporal</span>.
        </p>
      </CardContent>
    </Card>
  );
}
