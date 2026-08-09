/**
 * CsvExportService — exportación CSV — Sprint 3G
 */

import type { ReportExportBundle } from "./report.types";

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\r\n");
}

export class CsvExportService {
  generate(bundle: ReportExportBundle): Buffer {
    const sections: string[] = [];

    sections.push("# HydroVision — Exportación de datos ambientales");
    sections.push(`# Generado: ${bundle.generatedAt}`);
    sections.push(`# Responsable: ${bundle.responsable}`);
    sections.push(`# Periodo: ${bundle.filters.fechaInicio} — ${bundle.filters.fechaFin}`);
    sections.push("");

    if (bundle.sections.estaciones && bundle.stations.length) {
      sections.push("## ESTACIONES");
      sections.push(
        rowsToCsv(
          ["codigo", "nombre", "cuenca", "rio", "tramo", "latitud", "longitud", "estado"],
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
        )
      );
      sections.push("");
    }

    if (bundle.sections.estaciones && bundle.campaigns.length) {
      sections.push("## CAMPAÑAS");
      sections.push(
        rowsToCsv(
          ["codigo", "nombre", "cuenca", "rio", "fecha_inicio", "fecha_fin", "estado", "responsable"],
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
        )
      );
      sections.push("");
    }

    if (bundle.sections.mediciones) {
      sections.push("## MEDICIONES");
      sections.push(
        rowsToCsv(
          [
            "estacion_codigo",
            "campana_codigo",
            "fecha",
            "parametro_codigo",
            "parametro_nombre",
            "categoria",
            "valor",
            "unidad",
            "estado_eca",
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
        )
      );
      sections.push("");
    }

    if (bundle.sections.evaluacion && bundle.evaluations.length) {
      sections.push("## EVALUACIONES");
      sections.push(
        rowsToCsv(
          [
            "estacion_codigo",
            "estacion_nombre",
            "fecha",
            "estado",
            "indice_riesgo",
            "parametros_violados",
            "parametros_alerta",
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
        )
      );
    }

    if (bundle.measurements.length === 0 && bundle.stations.length === 0) {
      sections.push("## SIN REGISTROS");
      sections.push("No hay datos para los filtros seleccionados.");
    }

    const bom = "\uFEFF";
    return Buffer.from(bom + sections.join("\r\n"), "utf-8");
  }
}

export const csvExportService = new CsvExportService();
