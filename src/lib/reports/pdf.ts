/**
 * Cliente legacy — re-exporta servicios de reportes (Fase 3.4).
 * @deprecated Importar desde @/services/reports
 */

import { reportsModuleConfig } from "@/config";
import { pdfService } from "@/services/reports";
import type { ReportOptions } from "@/types/reports";

export const REPORTS_MODULE_STATUS = {
  enabled: reportsModuleConfig.enabled,
  message: reportsModuleConfig.message,
};

export type { ReportOptions };

export async function generateMonitoringReport(options: ReportOptions) {
  return pdfService.generateReport(options);
}

export { pdfService, excelService, statisticsService } from "@/services/reports";
