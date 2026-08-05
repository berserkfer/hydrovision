import type { ParameterDisplayConfig } from "@/types/station";

interface ParameterSparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

/**
 * Gráfico sparkline SVG minimalista para tendencias de parámetros.
 */
export function ParameterSparkline({
  data,
  color = "#0891b2",
  className = "",
}: ParameterSparklineProps) {
  if (data.length < 2) return null;

  const width = 72;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function getSparklineColor(param: ParameterDisplayConfig): string {
  const percent =
    ((param.value - param.min) / (param.max - param.min)) * 100;
  if (percent >= 85) return "#ef4444";
  if (percent >= 65) return "#f59e0b";
  return "#10b981";
}
