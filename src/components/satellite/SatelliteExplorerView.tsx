"use client";

import dynamic from "next/dynamic";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { SatelliteExplorerFilters } from "@/components/satellite/SatelliteExplorerFilters";
import { SatelliteImageResultsList } from "@/components/satellite/SatelliteImageResultsList";
import { SatelliteInfoPanel } from "@/components/satellite/SatelliteInfoPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useSatelliteExplorer } from "@/hooks/useSatelliteExplorer";

const SatellitePreviewMap = dynamic(
  () =>
    import("@/components/satellite/SatellitePreviewMap").then((mod) => mod.SatellitePreviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[28rem] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
        Cargando vista previa…
      </div>
    ),
  }
);

export function SatelliteExplorerView() {
  const explorer = useSatelliteExplorer();

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Explorador de Imágenes Satelitales"
        subtitle="Sentinel-2 · Cuenca del Río Reque · Consulta simulada preparada para Google Earth Engine"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SatelliteExplorerFilters explorer={explorer} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle>Vista previa del área de estudio</CardTitle>
                <CardDescription>
                  ROI simulada según cuenca, río y punto de monitoreo seleccionados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <SatellitePreviewMap
                  viewport={explorer.viewport}
                  basemapId={explorer.basemapId}
                  recenterToken={explorer.recenterToken}
                  onBasemapChange={explorer.setBasemapId}
                  onZoomIn={explorer.zoomIn}
                  onZoomOut={explorer.zoomOut}
                  onRecenter={explorer.recenterMap}
                />
              </CardContent>
            </Card>

            <SatelliteInfoPanel metadata={explorer.metadata} />
          </div>

          <SatelliteImageResultsList
            images={explorer.results}
            isSearching={explorer.isSearching}
          />
        </div>
      </div>
    </MainLayout>
  );
}
