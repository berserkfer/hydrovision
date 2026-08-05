"use client";

import type { TimeSeriesPoint } from "@/types";
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
import { formatShortDate } from "@/lib/utils";

interface TemporalChartProps {
  data: TimeSeriesPoint[];
}

export function TemporalChart({ data }: TemporalChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tendencia temporal (promedio cuenca)</CardTitle>
        <CardDescription>Serie simulada · Fase 3 incluirá datos por estación</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dissolvedOxygen"
                name="OD (mg/L)"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="turbidity"
                name="Turbidez (NTU)"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ph"
                name="pH"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
