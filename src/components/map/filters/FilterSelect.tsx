import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  hideLabel?: boolean;
}

/**
 * Select reutilizable para filtros geográficos con hover y focus profesionales.
 */
export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  className,
  style,
  disabled = false,
  hideLabel = false,
}: FilterSelectProps) {
  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)} style={style}>
      {!hideLabel && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors group-hover:text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white",
            "px-3 pr-9 text-sm text-slate-800 shadow-sm",
            "outline-none transition-all duration-200",
            "hover:border-slate-300 hover:shadow-md",
            "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-slate-600"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
