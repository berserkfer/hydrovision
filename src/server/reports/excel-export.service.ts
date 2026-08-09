/**
 * ExcelExportService — exportación XLSX — Sprint 3G
 */

import * as XLSX from "xlsx";
import type { ReportExportBundle } from "./report.types";

function autoWidthSheet(sheet: XLSX.WorkSheet, rows: Array<Array<string | number>>) {
  const colWidths = rows[0]?.map((_, colIdx) => {
    const maxLen = rows.reduce((max, row) => {
      const cell = row[colIdx];
      return Math.max(max, String(cell ?? "").length);
    }, 10);
    return { wch: Math.min(maxLen + 2, 40) };
  });
  if (colWidths) sheet["!cols"] = colWidths;
}

function addSheet(
  wb: XLSX.WorkBook,
  name: string,
  headers: string[],
  data: Array<Array<string | number>>
) {
  const rows = [headers, ...data];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  autoWidthSheet(sheet, rows);
  XLSX.utils.book_append_sheet(wb, sheet, name.slice(0, 31));
}

export class ExcelExportService {
  generate(bundle: ReportExportBundle): Buffer {
    const wb = XLSX.utils.book_new();
    const stats = bundle.preview.statistics;

    addSheet(wb, "Resumen", ["Campo", "Valor"], [
      ["Título", bundle.titulo],
      ["Generado", bundle.generatedAt],
      ["Responsable", bundle.responsable],
      ["Periodo", `${bundle.filters.fechaInicio} — ${bundle.filters.fechaFin}`],
      ["Total registros", stats.totalRegistros],
      ["Mediciones", stats.totalMediciones],
      ["Estaciones", stats.totalEstaciones],
      ["Campañas", stats.totalCampanas],
      ["Evaluaciones", stats.totalEvaluaciones],
      ["Cumplimiento ECA (%)", stats.cumplimientoEcaPct],
      ["Valor promedio", stats.valorPromedio ?? "—"],
      ["Valor mínimo", stats.valorMin ?? "—"],
      ["Valor máximo", stats.valorMax ?? "—"],
      ["Desviación estándar", stats.desviacionEstandar ?? "—"],
    ]);

    if (bundle.sections.estaciones) {
      addSheet(
        wb,
        "Estaciones",
        ["Código", "Nombre", "Cuenca", "Río", "Tramo", "Latitud", "Longitud", "Estado"],
        bundle.stations.map((s) => [
          s.codigo,
          s.nombre,
          s.cuenca,
          s.rio,
          s.tramo,
          s.latitud,
          s.longitud,
          s.estado,
        ])
      );

      addSheet(
        wb,
        "Campañas",
        ["Código", "Nombre", "Cuenca", "Río", "Inicio", "Fin", "Estado", "Responsable"],
        bundle.campaigns.map((c) => [
          c.codigo,
          c.nombre,
          c.cuenca,
          c.rio,
          c.fechaInicio,
          c.fechaFin,
          c.estado,
          c.responsable,
        ])
      );
    }

    if (bundle.sections.mediciones) {
      addSheet(
        wb,
        "Mediciones",
        [
          "Estación",
          "Campaña",
          "Fecha",
          "Código parámetro",
          "Parámetro",
          "Categoría",
          "Valor",
          "Unidad",
          "Estado ECA",
        ],
        bundle.measurements.map((m) => [
          m.estacionCodigo,
          m.campanaCodigo,
          m.fecha,
          m.parametroCodigo,
          m.parametroNombre,
          m.categoria,
          m.valor,
          m.unidad,
          m.estadoEca,
        ])
      );
    }

    if (bundle.sections.evaluacion) {
      addSheet(
        wb,
        "Evaluaciones",
        [
          "Estación",
          "Nombre",
          "Fecha",
          "Estado",
          "Índice riesgo",
          "Parámetros violados",
          "Parámetros en alerta",
        ],
        bundle.evaluations.map((e) => [
          e.estacionCodigo,
          e.estacionNombre,
          e.fecha,
          e.estado,
          e.indiceRiesgo,
          e.parametrosViolados,
          e.parametrosEnAlerta,
        ])
      );
    }

    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}

export const excelExportService = new ExcelExportService();
