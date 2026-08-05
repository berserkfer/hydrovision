import { ReportsView } from "@/components/reports/ReportsView";
import {
  buildEnvironmentalReport,
  getReportExecutiveStats,
} from "@/lib/repositories/report.repository";
import { DEFAULT_REPORT_FILTERS } from "@/types/report-management";

export default function ReportesPage() {
  const initialReport = buildEnvironmentalReport(DEFAULT_REPORT_FILTERS);
  const initialStats = getReportExecutiveStats(DEFAULT_REPORT_FILTERS);

  return <ReportsView initialReport={initialReport} initialStats={initialStats} />;
}
