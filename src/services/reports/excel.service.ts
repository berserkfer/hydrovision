/**
 * Servicio de exportación Excel — Fase 5.
 */

import type { ExcelExportOptions, ReportResult } from "@/types/reports";

export interface IExcelService {
  readonly isEnabled: boolean;
  exportData(options: ExcelExportOptions): Promise<ReportResult>;
}

export class MockExcelService implements IExcelService {
  readonly isEnabled = false;

  async exportData(_options: ExcelExportOptions): Promise<ReportResult> {
    return {
      success: false,
      message: "Exportación Excel disponible en Fase 5.",
    };
  }
}

export const excelService: IExcelService = new MockExcelService();
