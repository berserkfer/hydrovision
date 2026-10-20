import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { PredictionDashboard } from "@/components/prediction/PredictionDashboard";

export default function PrediccionPage() {
  return (
    <MainLayout>
      <PageContent>
        <div className="mx-auto max-w-[1600px]">
          <PredictionDashboard />
        </div>
      </PageContent>
    </MainLayout>
  );
}
