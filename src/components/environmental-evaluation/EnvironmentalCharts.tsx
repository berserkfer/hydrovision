"use client";

import type { TemporalTrendPoint } from "@/types/environmental-evaluation";
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

interface EnvironmentalChartsProps {
  trends: TemporalTrendPoint[];
}

const SERIES = [
  { key: "ph" as const, label: "pH", color: "#0891b2", unit: "—" },
  { key: "oxigenoDisuelto" as const, label: "Oxígeno disuelto", color: "#059669", unit: "mg/L" },
  { key: "turbidez" as const, label: "Turbidez", color: "#d97706", unit: "NTU" },
  { key: "conductividad" as const, label: "Conductividad", color: "#7c3aed", unit: "µS/cm" },
];

export function EnvironmentalCharts({ trends }: EnvironmentalChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {SERIES.map((series) => (
        <Card key={series.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución — {series.label}</CardTitle>
            <CardDescription className="text-xs">Tendencia temporal simulada · {series.unit}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tickFormatter={(v) => v.slice(5, 7)} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number) => [`${value} ${series.unit}`, series.label]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
