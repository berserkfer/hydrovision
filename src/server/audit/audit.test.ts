/**
 * Pruebas del módulo de auditoría — Sprint 3H
 */

import { describe, expect, it, beforeEach } from "vitest";
import { computeAuditDiff, summarizeDiff, toAuditPayload } from "@/server/audit/audit-diff";
import { auditService } from "@/server/audit/audit.service";
import { clearMockAuditLogs, getMockAuditLogs } from "@/server/audit/audit.repository";

beforeEach(() => {
  clearMockAuditLogs();
});

describe("CREATE", () => {
  it("registra creación de entidad", async () => {
    await auditService.recordCreate("Station", "st-1", { codigo: "E-01" }, "Estación creada");
    const logs = getMockAuditLogs();
    expect(logs[0]?.action).toBe("CREATE");
    expect(logs[0]?.entityType).toBe("Station");
    expect(logs[0]?.newData?.codigo).toBe("E-01");
  });
});

describe("UPDATE", () => {
  it("registra actualización con diff", async () => {
    await auditService.recordUpdate(
      "Campaign",
      "camp-1",
      { nombre: "Antes" },
      { nombre: "Después" },
      "Campaña actualizada"
    );
    const detail = await auditService.getById(getMockAuditLogs()[0]!.id);
    expect(detail?.action).toBe("UPDATE");
    expect(detail?.diff.some((d) => d.field === "nombre" && d.changed)).toBe(true);
  });
});

describe("DELETE", () => {
  it("registra eliminación con datos anteriores", async () => {
    await auditService.recordDelete("Parameter", "param-1", { codigo: "ph" }, "Parámetro eliminado");
    const log = getMockAuditLogs()[0];
    expect(log?.action).toBe("DELETE");
    expect(log?.previousData?.codigo).toBe("ph");
    expect(log?.newData).toBeNull();
  });
});

describe("IMPORT", () => {
  it("registra importación con conteos", async () => {
    await auditService.recordImport({
      importId: "import-1",
      fileName: "datos.csv",
      importedRows: 10,
      rejectedRows: 2,
      totalRows: 12,
      status: "partial",
    });
    const log = getMockAuditLogs()[0];
    expect(log?.action).toBe("IMPORT");
    expect(log?.entityType).toBe("DataImport");
    expect(log?.newData?.importedRows).toBe(10);
  });
});

describe("EXPORT", () => {
  it("registra exportación con filtros", async () => {
    await auditService.recordExport({
      exportId: "exp-1",
      fileFormat: "xlsx",
      fileName: "report.xlsx",
      recordCount: 50,
      filters: { fechaInicio: "2025-01-01" },
    });
    const log = getMockAuditLogs()[0];
    expect(log?.action).toBe("EXPORT");
    expect(log?.entityType).toBe("ReportExport");
  });
});

describe("Visualización del historial", () => {
  it("lista y resume eventos", async () => {
    await auditService.recordCreate("Measurement", "m-1", { valor: 7.2 });
    await auditService.recordDelete("Measurement", "m-1", { valor: 7.2 });
    const items = await auditService.list();
    const summary = await auditService.summary();
    expect(items.length).toBe(2);
    expect(summary.total).toBe(2);
    expect(summary.byAction.CREATE).toBe(1);
    expect(summary.byAction.DELETE).toBe(1);
  });
});

describe("Comparación entre versiones", () => {
  it("detecta campos modificados", () => {
    const diff = summarizeDiff(
      computeAuditDiff({ ph: 7.0, turbidez: 10 }, { ph: 7.5, turbidez: 10 })
    );
    expect(diff).toHaveLength(1);
    expect(diff[0]?.field).toBe("ph");
  });

  it("serializa payloads complejos", () => {
    const payload = toAuditPayload({ nested: { a: 1 } });
    expect(payload?.nested).toEqual({ a: 1 });
  });
});
