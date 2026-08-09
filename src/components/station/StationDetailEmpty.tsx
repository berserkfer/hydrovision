import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Estado vacío del panel lateral cuando no hay estación seleccionada.
 */
export function StationDetailEmpty() {
  return (
    <aside className="h-fit w-full shrink-0">
      <Card className="border-dashed">
        <CardContent className="p-0">
          <EmptyState
            icon={MapPin}
            title="Seleccione una estación"
            description="Haga clic en un marcador del mapa o en una fila de la tabla para ver el detalle completo de la estación."
          />
        </CardContent>
      </Card>
    </aside>
  );
}
