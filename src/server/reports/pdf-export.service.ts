/**
 * PdfExportService — reporte científico PDF — Sprint 3G
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportExportBundle } from "./report.types";

const BRAND = { r: 8, g: 145, b: 178 };

function filterSummary(bundle: ReportExportBundle): string[] {
  const f = bundle.filters;
  const lines: string[] = [];
  if (f.cuencaId) lines.push(`Cuenca: ${f.cuencaId}`);
  if (f.rioId) lines.push(`Río: ${f.rioId}`);
  if (f.estacionId) lines.push(`Estación: ${f.estacionId}`);
  if (f.campanaId) lines.push(`Campaña: ${f.campanaId}`);
  if (f.parametroCodigo) lines.push(`Parámetro: ${f.parametroCodigo}`);
  if (f.categoria) lines.push(`Categoría: ${f.categoria}`);
  if (f.estadoAmbiental) lines.push(`Estado ambiental: ${f.estadoAmbiental}`);
  lines.push(`Periodo: ${f.fechaInicio} — ${f.fechaFin}`);
  return lines.length ? lines : ["Sin filtros geográficos — periodo completo"];
}

function drawBarChart(
  doc: jsPDF,
  title: string,
  data: Array<{ label: string; value: number }>,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text(title, x, y);
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = width / Math.max(data.length, 1) - 4;
  data.forEach((point, i) => {
    const barH = (point.value / max) * (height - 20);
    const bx = x + i * (barW + 4);
    const by = y + height - barH;
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(bx, by, barW, barH, "F");
    doc.setFontSize(7);
    doc.text(point.label.slice(0, 8), bx, y + height + 4);
  });
}

export class PdfExportService {
  generate(bundle: ReportExportBundle): Buffer {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const stats = bundle.preview.statistics;

    // Portada
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 0, 210, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("HydroVision", 20, 25);
    doc.setFontSize(14);
    doc.text("Reporte Científico Ambiental", 20, 35);
    doc.setTextColor(30);
    doc.setFontSize(16);
    doc.text(bundle.titulo, 20, 65);
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${bundle.generatedAt.slice(0, 10)}`, 20, 78);
    doc.text(`Responsable: ${bundle.responsable}`, 20, 86);

    if (bundle.sections.resumen) {
      doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Resumen", 20, 105);
      doc.setFontSize(10);
      doc.setTextColor(50);
      const summaryLines = doc.splitTextToSize(
        `Se analizaron ${stats.totalEstaciones} estaciones, ${stats.totalCampanas} campañas y ${stats.totalMediciones} mediciones. Cumplimiento ECA: ${stats.cumplimientoEcaPct}%.`,
        170
      );
      doc.text(summaryLines, 20, 113);
    }

    doc.addPage();
    doc.setFontSize(13);
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text("Filtros utilizados", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(50);
    filterSummary(bundle).forEach((line, i) => doc.text(`• ${line}`, 20, 30 + i * 7));

    if (bundle.sections.estaciones) {
      doc.text("Estaciones analizadas", 20, 55);
      autoTable(doc, {
        startY: 60,
        head: [["Código", "Cuenca", "Río", "Tramo"]],
        body: bundle.stations.slice(0, 15).map((s) => [s.codigo, s.cuenca, s.rio, s.tramo]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
      });
    }

    if (bundle.sections.mediciones) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Tabla de mediciones", 20, 20);
      autoTable(doc, {
        startY: 28,
        head: [["Estación", "Campaña", "Fecha", "Parámetro", "Valor", "Unidad"]],
        body: bundle.measurements.slice(0, 40).map((m) => [
          m.estacionCodigo,
          m.campanaCodigo,
          m.fecha,
          m.parametroNombre,
          String(m.valor),
          m.unidad,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
      });
    }

    if (bundle.sections.graficos && bundle.charts.length) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Gráficos", 20, 20);
      const barChart = bundle.charts.find((c) => c.type === "bar");
      if (barChart?.data.length) {
        drawBarChart(doc, barChart.title, barChart.data.slice(0, 6), 20, 35, 170, 60);
      }
      const pieChart = bundle.charts.find((c) => c.type === "pie");
      if (pieChart?.data.length) {
        doc.setFontSize(10);
        doc.text(pieChart.title, 20, 110);
        pieChart.data.forEach((d, i) => {
          doc.text(`${d.label}: ${d.value}`, 25, 120 + i * 7);
        });
      }
    }

    if (bundle.sections.evaluacion) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Evaluación ambiental", 20, 20);
      autoTable(doc, {
        startY: 28,
        head: [["Estación", "Estado", "Riesgo", "Violaciones"]],
        body: bundle.evaluations.slice(0, 20).map((e) => [
          e.estacionCodigo,
          e.estado,
          String(e.indiceRiesgo),
          e.parametrosViolados,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
      });
    }

    if (bundle.sections.conclusiones) {
      const y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
      const startY = y > 250 ? 20 : y + 15;
      if (y > 250) doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Conclusiones", 20, startY);
      doc.setFontSize(10);
      doc.setTextColor(50);
      bundle.conclusions.forEach((line, i) => {
        const wrapped = doc.splitTextToSize(`• ${line}`, 170);
        doc.text(wrapped, 20, startY + 10 + i * 14);
      });
    }

    return Buffer.from(doc.output("arraybuffer"));
  }
}

export const pdfExportService = new PdfExportService();
