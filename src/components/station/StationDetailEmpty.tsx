import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function StationDetailEmpty({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="h-fit w-full shrink-0">
      <Card className="border-dashed border-[var(--hv-border-subtle)]">
        <CardContent className="p-0">
          <EmptyState
            icon={MapPin}
            title="Seleccione una estación"
            description={
              compact
                ? "Haga clic en un marcador del mapa para ver el detalle de la estación."
                : "Haga clic en un marcador del mapa o en una fila de la tabla para ver el detalle completo de la estación."
            }
          />
        </CardContent>
      </Card>
    </aside>
  );
}
