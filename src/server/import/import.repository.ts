/**
 * ImportRepository — persistencia e historial — Sprint 3F
 */

import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { ColumnMapping, ImportHistoryRecord, NormalizedImportRow } from "./import.types";
import type { ImportReferenceData } from "./import-validator";
import { getDataStore } from "@/data/store-access";
import { EstadoCampana } from "@/constants/enums";
import type { CampanaMonitoreo, Muestra, ParametrosFisicoquimicos } from "@/models/monitoring";
import type { EntityMeta } from "@/models/base";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";

const mockHistory: ImportHistoryRecord[] = [];

const DEFAULT_RESPONSABLE_ID = "usr-investigador";

export async function loadReferenceData(): Promise<ImportReferenceData> {
  if (isMonitoringDatabaseEnabled()) {
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
    // IMPORTANTE: debe reflejar el mismo catálogo que ParametroCodigoDb (parametros-catalog.ts)
    // completo — antes faltaban thermotolerant_coliforms y total_suspended_solids, lo que
    // bloqueaba silenciosamente la importación de exactamente los parámetros que este proyecto
    // más necesita (SST/coliformes termotolerantes de Dren 4000).
    parameterCodes: new Set([
      "ph",
      "turbidity",
      "conductivity",
      "dissolved_oxygen",
      "temperature",
      "bod5",
      "cod",
      "coliforms",
      "thermotolerant_coliforms",
      "nitrates",
      "phosphates",
      "total_dissolved_solids",
      "total_suspended_solids",
      "flow_rate",
    ]),
    parameterNames: new Set([
      "ph",
      "turbidez",
      "conductividad",
      "oxígeno disuelto",
      "temperatura",
      "dbo5",
      "dqo",
      "coliformes",
      "coliformes termotolerantes",
      "nitratos",
      "fosfatos",
      "sólidos disueltos totales",
      "sólidos suspendidos totales",
      "caudal",
    ]),
  };
}

export async function resolveDefaultResponsable(): Promise<{ id: string; nombre: string }> {
  if (isMonitoringDatabaseEnabled()) {
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
  if (isMonitoringDatabaseEnabled()) {
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

  if (isMonitoringDatabaseEnabled()) {
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

  // Persistencia mock — ANTES esta rama fingía éxito sin escribir nada en getDataStore(), así
  // que cualquier fila "importada" desaparecía sin dejar rastro fuera del historial. Ahora sí
  // escribe de verdad en el store compartido en memoria (estaciones/campañas/muestras/parámetros
  // ya existentes, marcados isSimulated:false — dato real del usuario, no sintético), visible
  // de inmediato en el resto de la app (detalle de estación, calibración, matching).
  const errors: string[] = [];
  let imported = 0;

  for (const row of input.rows) {
    try {
      importSingleRowMock(row, responsable.id);
      imported += 1;
    } catch (err) {
      errors.push(
        `Fila ${row.rowIndex}: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    }
  }

  const rejected = input.rejectedCount + (input.rows.length - imported);
  const status: "completed" | "partial" | "failed" =
    imported === 0 ? "failed" : imported < input.rows.length ? "partial" : "completed";

  const history: ImportHistoryRecord = {
    id: importId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    responsableNombre: responsable.nombre,
    totalRows: input.totalRows,
    importedRows: imported,
    rejectedRows: rejected,
    validRows: input.validCount,
    warningRows: input.warningCount,
    errorRows: input.errorCount,
    status,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  mockHistory.unshift(history);

  return {
    importId,
    importedRows: imported,
    rejectedRows: rejected,
    status,
    message:
      status === "completed"
        ? "Importación completada correctamente (almacén en memoria — sin base de datos conectada)"
        : status === "partial"
          ? "Importación parcial: algunos registros no pudieron insertarse"
          : `La importación falló${errors[0] ? `: ${errors[0]}` : ""}`,
  };
}

/** Campos numéricos de ParametrosFisicoquimicos — excluye metadatos e identificadores. */
type MeasurementField = Exclude<
  keyof ParametrosFisicoquimicos,
  keyof EntityMeta | "id" | "muestraId" | "estacionId"
>;

/** Mapea el código de parámetro (catálogo DB) al campo español de ParametrosFisicoquimicos. */
const PARAMETER_CODE_TO_FIELD: Record<ParametroCodigoDb, MeasurementField> = {
  ph: "ph",
  turbidity: "turbidez",
  conductivity: "conductividad",
  dissolved_oxygen: "oxigenoDisuelto",
  temperature: "temperatura",
  bod5: "dbo5",
  cod: "dqo",
  coliforms: "coliformes",
  thermotolerant_coliforms: "coliformesTermotolerantes",
  nitrates: "nitratos",
  phosphates: "fosfatos",
  total_dissolved_solids: "solidosDisueltosTotales",
  total_suspended_solids: "solidosSuspendidosTotales",
  flow_rate: "caudal",
};

/**
 * Resuelve la estación de una fila — con cuidado: en este store, el CÓDIGO ("P1".."P10") se
 * repite idéntico en cada río de demostración (rio-reque, rio-zana, rio-la-leche, rio-moche)
 * Y en Dren 4000. Si se resuelve solo por código y hay más de una coincidencia, NUNCA se elige
 * una al azar (eso misatribuiría datos reales de campo a una cuenca simulada equivocada) — se
 * exige el nombre completo de la estación o se lanza un error explícito pidiendo desambiguar.
 */
function resolveStationForImport(
  store: ReturnType<typeof getDataStore>,
  row: NormalizedImportRow
): (typeof store)["estaciones"][number] {
  if (row.stationName) {
    const byName = store.estaciones.filter(
      (e) => e.nombre.toLowerCase() === row.stationName!.toLowerCase()
    );
    if (byName.length === 1) return byName[0];
  }

  if (row.stationCode) {
    const byCode = store.estaciones.filter((e) => e.codigo.toUpperCase() === row.stationCode);
    if (byCode.length === 1) return byCode[0];
    if (byCode.length > 1) {
      const rivers = byCode.map((e) => e.rioId).join(", ");
      throw new Error(
        `Código de estación '${row.stationCode}' es ambiguo — existe en ${byCode.length} ríos distintos (${rivers}). Use el nombre completo de la estación (columna "station") para desambiguar.`
      );
    }
  }

  throw new Error("Estación no encontrada");
}

function importSingleRowMock(row: NormalizedImportRow, responsableId: string): void {
  const store = getDataStore();
  const station = resolveStationForImport(store, row);

  let campaign = row.campaign
    ? store.campanas.find(
        (c) =>
          c.codigo.toUpperCase() === row.campaign!.toUpperCase() ||
          c.nombre.toLowerCase() === row.campaign!.toLowerCase()
      )
    : store.campanas
        .filter((c) => c.rioId === station.rioId)
        .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0];

  if (!campaign && !row.campaign) {
    // Sin campaña especificada y ninguna existente para este río — se crea una nueva, tal
    // como advierte el validador ("se intentará inferir durante la importación"). Antes esto
    // nunca ocurría: el flujo Prisma lanzaba "Campaña no encontrada" y el mock ni lo intentaba.
    const yearMonth = (row.date ?? new Date().toISOString().slice(0, 10)).slice(0, 7);
    const newCampaign: CampanaMonitoreo = {
      id: `camp-import-${station.rioId}-${yearMonth}`,
      codigo: `IMPORT-${station.rioId.toUpperCase()}-${yearMonth}`,
      nombre: `Importación de datos — ${yearMonth}`,
      rioId: station.rioId,
      cuencaId: station.cuencaId,
      fechaInicio: row.date ?? new Date().toISOString().slice(0, 10),
      fechaFin: row.date ?? new Date().toISOString().slice(0, 10),
      responsableId,
      estado: EstadoCampana.EN_CURSO,
      objetivo: "Campaña generada automáticamente al importar datos sin campaña asignada.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSimulated: false,
    };
    store.campanas.push(newCampaign);
    campaign = newCampaign;
  }
  if (!campaign) throw new Error("Campaña no encontrada");

  if (!row.date) throw new Error("Fecha de muestreo obligatoria");
  const fechaMuestreo = `${row.date}T00:00:00-05:00`;

  let muestra = store.muestras.find(
    (m) => m.campanaId === campaign!.id && m.estacionId === station.id && m.fechaMuestreo === fechaMuestreo
  );
  if (!muestra) {
    const newMuestra: Muestra = {
      id: `muestra-import-${station.id}-${row.date}-${row.rowIndex}`,
      campanaId: campaign.id,
      estacionId: station.id,
      codigoMuestra: `IMP-${station.codigo}-${row.date}-${row.rowIndex}`,
      fechaMuestreo,
      responsableId,
      clima: "no reportado",
      colorAparente: "no reportado",
      observaciones: row.observations ?? "Importado desde archivo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSimulated: false,
    };
    store.muestras.push(newMuestra);
    muestra = newMuestra;
  }

  const paramCode = (row.parameter ?? "") as ParametroCodigoDb;
  const field = PARAMETER_CODE_TO_FIELD[paramCode];
  if (!field) throw new Error(`Parámetro '${row.parameter}' no está mapeado`);
  if (row.value == null) throw new Error("Valor numérico obligatorio");

  let parametros = store.parametros.find((p) => p.muestraId === muestra!.id);
  if (!parametros) {
    const newParametros: ParametrosFisicoquimicos = {
      id: `param-import-${muestra.id}`,
      muestraId: muestra.id,
      estacionId: station.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSimulated: false,
    };
    store.parametros.push(newParametros);
    parametros = newParametros;
  }
  parametros[field] = row.value;
  parametros.updatedAt = new Date().toISOString();
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
