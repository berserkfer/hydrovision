import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export interface KpiItem<T> {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  getValue: (data: T) => number | string;
}

interface KpiGridProps<T> {
  data: T;
  items: readonly KpiItem<T>[];
  columns?: "2" | "4";
}

export function KpiGrid<T>({ data, items, columns = "4" }: KpiGridProps<T>) {
  const gridClass =
    columns === "2"
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {items.map(({ key, label, icon: Icon, color, getValue }) => (
        <Card key={key} className="transition-shadow duration-300 hover:shadow-md">
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--hv-foreground)]">{getValue(data)}</p>
              <p className="text-sm text-[var(--hv-foreground-muted)]">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
