import { getProgressColor, normalizeParameter } from "@/lib/station/station-utils";

interface ParameterProgressBarProps {
  value: number;
  min: number;
  max: number;
  label?: string;
}

/**
 * Barra de progreso normalizada para visualizar parámetros fisicoquímicos.
 */
export function ParameterProgressBar({ value, min, max }: ParameterProgressBarProps) {
  const percent = normalizeParameter(value, min, max);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  );
}
