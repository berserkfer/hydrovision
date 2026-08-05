import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Estado vacío del panel lateral cuando no hay estación seleccionada.
 */
export function StationDetailEmpty() {
  return (
    <aside className="h-fit w-full shrink-0">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Seleccione una estación</p>
          <p className="mt-1 max-w-[240px] text-xs text-slate-500">
            Haga clic en un marcador del mapa o en una fila de la tabla para ver el detalle
            completo de la estación.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
