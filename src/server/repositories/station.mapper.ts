/**
 * Mapeo Prisma Station → DTO — Sprint 3C
 */

import type { ComplianceStatus } from "@/types";
import type { OperationalStatus } from "@/types/station";
import type { StationSummaryDto } from "@/server/dto/station.dto";
import type { Prisma } from "@prisma/client";

export type StationListRow = Prisma.StationGetPayload<{
  include: {
    rio: true;
    cuenca: true;
    department: true;
    _count: { select: { muestreos: true } };
    evaluacionesAmbiental: true;
    muestreos: { take: 1; orderBy: { fechaMuestreo: "desc" } };
  };
}>;

const PRISMA_ESTADO: Record<string, OperationalStatus> = {
  active: "active",
  maintenance: "maintenance",
  offline: "offline",
};

const PRISMA_ECA: Record<string, ComplianceStatus> = {
  compliant: "compliant",
  alert: "alert",
  non_compliant: "non_compliant",
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapClasificacionEca(
  evaluaciones: StationListRow["evaluacionesAmbiental"]
): ComplianceStatus {
  const latest = evaluaciones[0];
  if (!latest) return "compliant";
  return PRISMA_ECA[latest.estado] ?? "compliant";
}

export function mapStationRowToDto(
  row: StationListRow,
  isSimulated = false
): StationSummaryDto {
  const ultimaMuestra = row.muestreos[0]?.fechaMuestreo;

  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    rioId: row.rioId ?? "",
    rioNombre: row.rio?.nombre ?? "—",
    cuencaId: row.cuencaId,
    cuencaNombre: row.cuenca.nombre,
    departamentoNombre: row.department.nombre,
    latitud: row.latitude,
    longitud: row.longitude,
    altitud: row.altitud,
    tramo: row.tramo,
    estado: PRISMA_ESTADO[row.estado] ?? "active",
    fechaUltimaCampana: ultimaMuestra ? toDateOnly(ultimaMuestra) : null,
    clasificacionEca: mapClasificacionEca(row.evaluacionesAmbiental),
    cantidadMediciones: row._count.muestreos,
    descripcion: row.descripcion ?? "",
    fechaInstalacion: toDateOnly(row.fechaInstalacion),
    ultimaActualizacion: row.ultimaActualizacion.toISOString(),
    isSimulated,
  };
}

export function buildFilterOptionsFromStations(stations: StationSummaryDto[]) {
  const cuencas = Array.from(
    new Map(stations.map((s) => [s.cuencaId, { value: s.cuencaId, label: s.cuencaNombre }])).values()
  );
  const rios = Array.from(
    new Map(stations.map((s) => [s.rioId, { value: s.rioId, label: s.rioNombre }])).values()
  );
  return { cuencas, rios };
}
