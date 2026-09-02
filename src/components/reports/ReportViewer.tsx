"use client";

import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { ReportCharts } from "@/components/reports/ReportCharts";
import { ReportTableList } from "@/components/reports/ReportTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { REPORT_TABS } from "@/types/report-management";
import type {
  EnvironmentalReportDocument,
  ReportSectionContent,
  ReportTabId,
} from "@/types/report-management";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface ReportViewerProps {
  report: EnvironmentalReportDocument;
  activeTab: ReportTabId;
  onTabChange: (tab: ReportTabId) => void;
  activeSection: ReportSectionContent;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  exportMessage: string | null;
}

export function ReportViewer({
  report,
  activeTab,
  onTabChange,
  activeSection,
  onExportPdf,
  onExportExcel,
  onPrint,
  exportMessage,
}: ReportViewerProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="mr-1" aria-hidden>
                {tab.emoji}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButton icon={FileText} label="Exportar PDF" onClick={onExportPdf} />
          <ExportButton icon={FileSpreadsheet} label="Exportar Excel" onClick={onExportExcel} />
          <ExportButton icon={Printer} label="Imprimir" onClick={onPrint} primary />
        </div>
      </div>

      {exportMessage && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 print:hidden">
          {exportMessage}
        </div>
      )}

      <div
        id="report-preview"
        className="rounded-xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none"
      >
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 print:bg-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                HydroVision · Reporte Científico
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">{activeSection.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{report.titulo}</p>
            </div>
            <SimulatedDataIndicator />
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-300">
            <MetaItem label="Generado" value={formatDate(activeSection.generatedAt)} />
            <MetaItem label="Responsable" value={activeSection.responsable} />
            <MetaItem
              label="Periodo"
              value={`${report.filtersApplied.fechaInicio} — ${report.filtersApplied.fechaFin}`}
            />
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{activeSection.summary}</p>
            </CardContent>
          </Card>

          <ReportTableList tables={activeSection.tables} />
          <ReportCharts charts={activeSection.charts} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conclusiones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
                {activeSection.conclusions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 print:text-slate-600">
            Documento simulado — HydroVision Platform · Sprint 2F · No constituye informe oficial.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-500">{label}: </span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ExportButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium shadow-sm transition-colors",
        primary
          ? "bg-cyan-600 text-white hover:bg-cyan-700"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
