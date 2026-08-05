import {
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Waves,
  Wind,
  FlaskConical,
} from "lucide-react";
import type { ParameterDisplayConfig } from "@/types/station";
import { ParameterProgressBar } from "./ParameterProgressBar";
import { ParameterSparkline, getSparklineColor } from "./ParameterSparkline";

const ICONS = {
  ph: FlaskConical,
  temperature: Thermometer,
  conductivity: Gauge,
  oxygen: Wind,
  turbidity: Droplets,
  tds: Waves,
  flow: Activity,
};

interface ParameterCardProps {
  param: ParameterDisplayConfig;
}

/**
 * Tarjeta de parámetro con icono, valor, barra de progreso y sparkline.
 */
export function ParameterCard({ param }: ParameterCardProps) {
  const Icon = ICONS[param.icon];

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {param.label}
            </p>
            <p className="font-mono text-sm font-semibold text-slate-900">
              {param.value}{" "}
              <span className="text-xs font-normal text-slate-400">{param.unit}</span>
            </p>
          </div>
        </div>
        <ParameterSparkline data={param.trend} color={getSparklineColor(param)} />
      </div>
      <div className="mt-2.5">
        <ParameterProgressBar value={param.value} min={param.min} max={param.max} />
      </div>
    </div>
  );
}
