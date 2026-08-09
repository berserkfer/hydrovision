import { ExportReportsView } from "@/components/export-reports/ExportReportsView";
import { reportService } from "@/server/reports/report.service";

export const dynamic = "force-dynamic";

export default async function ReportsExportPage() {
  const [history, filterOptions] = await Promise.all([
    reportService.history(),
    Promise.resolve(reportService.filterOptions()),
  ]);

  return <ExportReportsView initialHistory={history} filterOptions={filterOptions} />;
}
