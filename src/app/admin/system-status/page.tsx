import { MainLayout } from "@/components/layout/MainLayout";
import { SystemStatusPanel } from "@/components/admin/SystemStatusPanel";

export const metadata = {
  title: "HydroVision — Estado del Sistema",
  description: "Diagnóstico interno de configuración GEE y servicios",
};

export default function SystemStatusPage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <SystemStatusPanel />
        </div>
      </div>
    </MainLayout>
  );
}
