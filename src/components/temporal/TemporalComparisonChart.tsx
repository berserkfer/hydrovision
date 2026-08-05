"use client";

import type { TemporalAnalysisResult } from "@/types/temporal";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { formatDateRange } from "@/utils/date.utils";

interface TemporalComparisonChartProps {
  result: TemporalAnalysisResult;
}

export function TemporalComparisonChart({ result }: TemporalComparisonChartProps) {
  const { currentSeries, previousSeries, chartData } = result;
  const unit = currentSeries.unit;

  return (
    <Card className="hv-animate-fade-in overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-white/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {currentSeries.parameterLabel} — {currentSeries.stationName}
            </CardTitle>
            <CardDescription>
              Periodo actual ({formatDateRange(currentSeries.startDate, currentSeries.endDate)}) vs
              periodo anterior ({formatDateRange(previousSeries.startDate, previousSeries.endDate)})
            </CardDescription>
          </div>
          <SimulatedDataIndicator />
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                label={{
                  value: unit,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#94a3b8" },
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  value != null ? `${value} ${unit}` : "—",
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="current"
                name="Periodo actual"
                stroke="#0891b2"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0891b2" }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="previous"
                name="Periodo anterior"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "#94a3b8" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
