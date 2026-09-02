import fs from "fs";
import path from "path";

const files = [
  "src/components/campaigns/CampaignsView.tsx",
  "src/components/campaigns/CampaignDetailView.tsx",
  "src/components/sampling/SamplingView.tsx",
  "src/components/sampling/SampleDetailView.tsx",
  "src/components/temporal/TemporalAnalysisView.tsx",
  "src/components/map/GisMapView.tsx",
  "src/components/geospatial/GeospatialCenterView.tsx",
  "src/components/indicators/IndicatorsCenterView.tsx",
  "src/components/environmental-evaluation/EvaluationCenterView.tsx",
  "src/components/parameters/ParametersView.tsx",
  "src/components/parameters/ParameterDetailView.tsx",
  "src/components/stations/StationsView.tsx",
  "src/components/stations/StationDetailView.tsx",
  "src/components/reports/ReportsView.tsx",
  "src/components/satellite/SatelliteExplorerView.tsx",
  "src/components/import/ImportView.tsx",
  "src/app/admin/system-status/page.tsx",
  "src/components/audit/AuditView.tsx",
  "src/components/users/UsersView.tsx",
  "src/components/export-reports/ExportReportsView.tsx",
];

const root = process.cwd();

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.log("skip", rel);
    continue;
  }
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  if (!content.includes("PageContent")) {
    if (content.includes('from "@/components/layout/MonitoringHeader"')) {
      content = content.replace(
        'import { MonitoringHeader } from "@/components/layout/MonitoringHeader";',
        'import { MonitoringHeader } from "@/components/layout/MonitoringHeader";\nimport { PageContent } from "@/components/layout/PageContent";'
      );
      changed = true;
    } else if (content.includes('from "@/components/layout/MainLayout"')) {
      content = content.replace(
        'import { MainLayout } from "@/components/layout/MainLayout";',
        'import { MainLayout } from "@/components/layout/MainLayout";\nimport { PageContent } from "@/components/layout/PageContent";'
      );
      changed = true;
    }
  }

  if (content.includes('className="flex-1 overflow-y-auto px-6 py-6')) {
    content = content.replace(
      /<div className="flex-1 overflow-y-auto px-6 py-6([^"]*)">/g,
      '<PageContent className="$1">'
    );
    changed = true;
  }

  if (content.includes('className="space-y-6 p-4 md:p-6"')) {
    content = content.replace(
      '<div className="space-y-6 p-4 md:p-6">',
      '<PageContent className="space-y-6">'
    );
    changed = true;
  }

  if (content.includes("<PageContent")) {
    const before = content;
    content = content.replace(/<\/div>\s*\n(\s*)<\/MainLayout>/g, "</PageContent>\n$1</MainLayout>");
    if (content !== before) changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("updated", rel);
  }
}
