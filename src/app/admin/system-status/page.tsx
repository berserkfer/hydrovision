import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { SystemStatusPanel } from "@/components/admin/SystemStatusPanel";

export const metadata = {
  title: "HydroVision — Estado del Sistema",
  description: "Diagnóstico interno de configuración GEE y servicios",
};

export default function SystemStatusPage() {
  return (
    <MainLayout>
      <PageContent className="">
        <div className="mx-auto max-w-6xl">
          <SystemStatusPanel />
        </div>
      </PageContent>
    </MainLayout>
  );
}
