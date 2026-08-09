/**
 * Pruebas del módulo de exportación — Sprint 3G
 */

import { describe, expect, it } from "vitest";
import { buildExportBundle, buildExportPreview } from "@/server/reports/report-data.builder";
import { csvExportService } from "@/server/reports/csv-export.service";
import { excelExportService } from "@/server/reports/excel-export.service";
import { pdfExportService } from "@/server/reports/pdf-export.service";
import { reportService } from "@/server/reports/report.service";
import {
  DEFAULT_EXPORT_FILTERS,
  DEFAULT_EXPORT_SECTIONS,
} from "@/server/reports/report.types";

describe("Exportación sin registros", () => {
  it("preview vacío con filtros restrictivos", () => {
    const preview = buildExportPreview({
      ...DEFAULT_EXPORT_FILTERS,
      fechaInicio: "2099-01-01",
      fechaFin: "2099-12-31",
    });
    expect(preview.isEmpty).toBe(true);
    expect(preview.statistics.totalMediciones).toBe(0);
  });
});

describe("Exportación con filtros", () => {
  it("incluye mediciones en periodo por defecto", () => {
    const preview = buildExportPreview(DEFAULT_EXPORT_FILTERS);
    expect(preview.statistics.totalMediciones).toBeGreaterThan(0);
    expect(preview.estaciones.length).toBeGreaterThan(0);
  });
});

describe("CSV", () => {
  it("genera buffer UTF-8 con BOM y encabezados", () => {
    const bundle = buildExportBundle(DEFAULT_EXPORT_FILTERS, DEFAULT_EXPORT_SECTIONS, "Test");
    const buf = csvExportService.generate(bundle);
    const text = buf.toString("utf-8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("estacion_codigo");
    expect(text).toContain("MEDICIONES");
  });
});

describe("XLSX", () => {
  it("genera archivo binario no vacío", () => {
    const bundle = buildExportBundle(DEFAULT_EXPORT_FILTERS, DEFAULT_EXPORT_SECTIONS, "Test");
    const buf = excelExportService.generate(bundle);
    expect(buf.length).toBeGreaterThan(100);
    expect(buf[0]).toBe(0x50); // PK zip signature
  });
});

describe("PDF", () => {
  it("genera PDF válido", () => {
    const bundle = buildExportBundle(DEFAULT_EXPORT_FILTERS, DEFAULT_EXPORT_SECTIONS, "Test");
    const buf = pdfExportService.generate(bundle);
    const header = buf.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });
});

describe("Fechas", () => {
  it("respeta rango de fechas en preview", () => {
    const preview = buildExportPreview({
      ...DEFAULT_EXPORT_FILTERS,
      fechaInicio: "2025-06-01",
      fechaFin: "2025-06-30",
    });
    if (preview.dateRange) {
      expect(preview.dateRange.inicio >= "2025-06-01").toBe(true);
      expect(preview.dateRange.fin <= "2025-06-30").toBe(true);
    }
  });
});

describe("Grandes cantidades", () => {
  it("export service completa sin error", async () => {
    const result = await reportService.export(DEFAULT_EXPORT_FILTERS, "csv", DEFAULT_EXPORT_SECTIONS);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName).toMatch(/\.csv$/);
    expect(result.recordCount).toBeGreaterThan(0);
  });
});
