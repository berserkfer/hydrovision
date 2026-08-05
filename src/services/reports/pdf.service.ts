/**
 * Servicio de generación de reportes PDF — Fase 5.
 */

import type { ReportOptions, ReportResult } from "@/types/reports";

export interface IPDFService {
  readonly isEnabled: boolean;
  generateReport(options: ReportOptions): Promise<ReportResult>;
}

export class MockPDFService implements IPDFService {
  readonly isEnabled = false;

  async generateReport(_options: ReportOptions): Promise<ReportResult> {
    return {
      success: false,
      message: "Módulo de reportes PDF en desarrollo (Fase 5).",
    };
  }
}

export const pdfService: IPDFService = new MockPDFService();
