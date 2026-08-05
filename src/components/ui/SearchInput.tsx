import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  id,
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 shadow-sm",
          "outline-none transition-all duration-200",
          "hover:border-slate-300 hover:shadow-md",
          "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
        )}
      />
    </div>
  );
}
