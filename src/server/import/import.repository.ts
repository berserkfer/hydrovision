/**
 * ImportRepository — persistencia e historial — Sprint 3F
 */

import { isDatabaseConfigured } from "@/config/database.config";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { ColumnMapping, ImportHistoryRecord, NormalizedImportRow } from "./import.types";
import type { ImportReferenceData } from "./import-validator";
import { getDataStore } from "@/data/store-access";

const mockHistory: ImportHistoryRecord[] = [];

const DEFAULT_RESPONSABLE_ID = "usr-investigador";

export async function loadReferenceData(): Promise<ImportReferenceData> {
  if (isDatabaseConfigured()) {
    try {
      const [stations, campaigns, parameters] = await Promise.all([
        prisma.station.findMany({
          where: { estadoRegistro: "active" },
          select: { codigo: true, nombre: true },
        }),
        prisma.campaign.findMany({ select: { codigo: true, nombre: true } }),
        prisma.parameter.findMany({
          where: { estado: "active" },
          select: { codigo: true, nombre: true },
        }),
      ]);
      return {
        stationCodes: new Set(stations.map((s) => s.codigo.toUpperCase())),
        stationNames: new Set(stations.map((s) => s.nombre.toLowerCase())),
        campaignCodes: new Set(campaigns.map((c) => c.codigo.toUpperCase())),
        campaignNames: new Set(campaigns.map((c) => c.nombre.toLowerCase())),
        parameterCodes: new Set(parameters.map((p) => p.codigo.toLowerCase())),
        parameterNames: new Set(parameters.map((p) => p.nombre.toLowerCase())),
      };
    } catch {
      // fall through to mock
    }
  }

  const store = getDataStore();
  return {
    stationCodes: new Set(store.estaciones.map((s) => s.codigo.toUpperCase())),
    stationNames: new Set(store.estaciones.map((s) => s.nombre.toLowerCase())),
    campaignCodes: new Set(store.campanas.map((c) => c.codigo.toUpperCase())),
    campaignNames: new Set(store.campanas.map((c) => c.nombre.toLowerCase())),
    parameterCodes: new Set([
      "ph",
      "turbidity",
      "conductivity",
      "dissolved_oxygen",
      "temperature",
      "bod5",
      "cod",
      "coliforms",
      "nitrates",
      "phosphates",
      "total_dissolved_solids",
      "flow_rate",
    ]),
    parameterNames: new Set([
      "ph",
      "turbidez",
      "conductividad",
      "oxígeno disuelto",
      "temperatura",
    ]),
  };
}

export async function resolveDefaultResponsable(): Promise<{ id: string; nombre: string }> {
  if (isDatabaseConfigured()) {
    try {
      const user = await prisma.usuario.findFirst({
        where: { activo: true, estado: "active" },
        orderBy: { createdAt: "asc" },
      });
      if (user) return { id: user.id, nombre: user.nombre };
    } catch {
      // mock fallback
    }
  }
  const store = getDataStore();
  const mockUser = store.usuarios[0];
  return {
    id: mockUser?.id ?? DEFAULT_RESPONSABLE_ID,
    nombre: mockUser?.nombre ?? "Responsable HydroVision",
  };
}

export async function listImportHistory(): Promise<ImportHistoryRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.dataImport.findMany({
        orderBy: { startedAt: "desc" },
        take: 50,
      });
      return rows.map(mapHistoryRow);
    } catch {
      // mock fallback
    }
  }
  return [...mockHistory].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function mapHistoryRow(row: {
  id: string;
  fileName: string;
  fileSize: number;
  responsableNombre: string | null;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
}): ImportHistoryRecord {
  return {
    id: row.id,
    fileName: row.fileName,
    fileSize: row.fileSize,
    responsableNombre: row.responsableNombre ?? "—",
    totalRows: row.totalRows,
    importedRows: row.importedRows,
    rejectedRows: row.rejectedRows,
    validRows: row.validRows,
    warningRows: row.warningRows,
    errorRows: row.errorRows,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export interface ExecuteImportInput {
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  mapping: ColumnMapping;
  rows: NormalizedImportRow[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  totalRows: number;
  rejectedCount: number;
}

export async function executeImportTransaction(input: ExecuteImportInput) {
  const responsable = await resolveDefaultResponsable();
  const importId = `import-${Date.now()}`;

  if (isDatabaseConfigured()) {
    try {
      return await prisma.$transaction(async (tx) => {
        const record = await tx.dataImport.create({
          data: {
            id: importId,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            responsableId: responsable.id,
            responsableNombre: responsable.nombre,
            totalRows: input.totalRows,
            validRows: input.validCount,
            warningRows: input.warningCount,
            errorRows: input.errorCount,
            columnMapping: input.mapping,
            status: "pending",
          },
        });

        let imported = 0;
        const errors: string[] = [];

        for (const row of input.rows) {
          try {
            await importSingleRow(tx, row, responsable.id);
            imported += 1;
          } catch (err) {
            errors.push(
              `Fila ${row.rowIndex}: ${err instanceof Error ? err.message : "Error desconocido"}`
            );
          }
        }

        const rejected = input.rejectedCount + (input.rows.length - imported);
        const status =
          imported === 0 ? "failed" : imported < input.rows.length ? "partial" : "completed";

        const updated = await tx.dataImport.update({
          where: { id: record.id },
          data: {
            importedRows: imported,
            rejectedRows: rejected,
            status,
            errorLog: errors.length ? errors : undefined,
            completedAt: new Date(),
          },
        });

        return {
          importId: updated.id,
          importedRows: imported,
          rejectedRows: rejected,
          status: status as "completed" | "partial" | "failed",
          message:
            status === "completed"
              ? "Importación completada correctamente"
              : status === "partial"
                ? "Importación parcial: algunos registros no pudieron insertarse"
                : "La importación falló",
        };
      });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.database(
        err instanceof Error ? err.message : "Error en transacción de importación"
      );
    }
  }

  // Mock persistence
  const imported = input.rows.length;
  const history: ImportHistoryRecord = {
    id: importId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    responsableNombre: responsable.nombre,
    totalRows: input.totalRows,
    importedRows: imported,
    rejectedRows: input.rejectedCount,
    validRows: input.validCount,
    warningRows: input.warningCount,
    errorRows: input.errorCount,
    status: imported > 0 ? "completed" : "failed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  mockHistory.unshift(history);

  return {
    importId,
    importedRows: imported,
    rejectedRows: input.rejectedCount,
    status: (imported > 0 ? "completed" : "failed") as "completed" | "partial" | "failed",
    message: imported > 0 ? "Importación simulada completada" : "Importación simulada fallida",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importSingleRow(tx: any, row: NormalizedImportRow, responsableId: string) {
  const station = await tx.station.findFirst({
    where: row.stationCode
      ? { codigo: row.stationCode, estadoRegistro: "active" }
      : { nombre: { equals: row.stationName, mode: "insensitive" }, estadoRegistro: "active" },
  });
  if (!station) throw new Error("Estación no encontrada");

  const campaign = row.campaign
    ? await tx.campaign.findFirst({
        where: {
          OR: [
            { codigo: { equals: row.campaign, mode: "insensitive" } },
            { nombre: { equals: row.campaign, mode: "insensitive" } },
          ],
        },
      })
    : await tx.campaign.findFirst({
        where: { rioId: station.rioId ?? undefined },
        orderBy: { fechaInicio: "desc" },
      });
  if (!campaign) throw new Error("Campaña no encontrada");

  const paramCode = (row.parameter ?? "ph") as string;
  const parameter = await tx.parameter.findFirst({
    where: { codigo: paramCode as never, estado: "active" },
  });
  if (!parameter) throw new Error(`Parámetro '${row.parameter}' no encontrado`);

  const sampleDate = new Date(`${row.date}T12:00:00.000Z`);
  const sampleCode = `IMP-${station.codigo}-${row.date}-${row.rowIndex}`;

  let muestreo = await tx.muestreo.findFirst({
    where: {
      campanaId: campaign.id,
      puntoMonitoreoId: station.id,
      fechaMuestreo: sampleDate,
    },
  });

  if (!muestreo) {
    muestreo = await tx.muestreo.create({
      data: {
        id: `muestreo-imp-${Date.now()}-${row.rowIndex}`,
        campanaId: campaign.id,
        puntoMonitoreoId: station.id,
        codigoMuestra: sampleCode,
        fechaMuestreo: sampleDate,
        responsableId,
        clima: "N/D",
        colorAparente: "N/D",
        observaciones: row.observations ?? "Importado desde archivo",
        estado: "registered",
      },
    });
  }

  const existing = await tx.measurement.findFirst({
    where: { muestreoId: muestreo.id, parametroId: parameter.id },
  });
  if (existing) {
    await tx.measurement.update({
      where: { id: existing.id },
      data: {
        valor: row.value ?? 0,
        unidad: row.unit ?? parameter.unidad,
        observaciones: row.observations,
        fechaMedicion: sampleDate,
      },
    });
    return;
  }

  await tx.measurement.create({
    data: {
      id: `med-imp-${Date.now()}-${row.rowIndex}`,
      muestreoId: muestreo.id,
      campanaId: campaign.id,
      parametroId: parameter.id,
      puntoMonitoreoId: station.id,
      valor: row.value ?? 0,
      unidad: row.unit ?? parameter.unidad,
      fechaMedicion: sampleDate,
      responsableId,
      observaciones: row.observations,
      calidadDato: "valid",
      estado: "active",
    },
  });
}
