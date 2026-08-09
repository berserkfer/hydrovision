"use client";

import { useCallback, useState } from "react";
import { FileDown, Upload } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { FilePreview } from "@/components/import/FilePreview";
import { FileUploader } from "@/components/import/FileUploader";
import { ImportConfirmation } from "@/components/import/ImportConfirmation";
import { ImportHistory } from "@/components/import/ImportHistory";
import { ImportResult } from "@/components/import/ImportResult";
import { ValidationSummary } from "@/components/import/ValidationSummary";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import {
  executeImport,
  fetchImportHistory,
  previewImportFile,
  validateImportData,
} from "@/lib/api/import.client";
import { notifyError, notifySuccess, withApiToast } from "@/lib/api/notify";
import type { ColumnMapping, ImportHistoryRecord, ImportValidationSummary } from "@/server/import/import.types";
import type { ImportPreviewResult } from "@/server/import/import.service";

type Step = "upload" | "preview" | "validated" | "done";

interface ImportViewProps {
  initialHistory: ImportHistoryRecord[];
}

export function ImportView({ initialHistory }: ImportViewProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ImportValidationSummary | null>(null);
  const [result, setResult] = useState<{
    importId: string;
    importedRows: number;
    rejectedRows: number;
    status: string;
    message: string;
  } | null>(null);
  const [history, setHistory] = useState(initialHistory);

  const refreshHistory = useCallback(async () => {
    const data = await fetchImportHistory();
    setHistory(data.items);
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setValidation(null);
    try {
      const data = await previewImportFile(file);
      setPreview(data);
      setMapping(data.suggestedMapping);
      setStep("preview");
    } catch (error) {
      notifyError(error, "No se pudo leer el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const summary = await validateImportData(preview.rows, mapping);
      setValidation(summary);
      setStep("validated");
    } catch (error) {
      notifyError(error, "Error en validación");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !validation) return;
    setLoading(true);
    const response = await withApiToast(
      () =>
        executeImport({
          validation,
          fileName: preview.fileName,
          fileSize: preview.fileSize,
          mimeType: preview.mimeType,
          mapping,
        }),
      { success: "Importación procesada", error: "Error al importar datos" }
    );
    if (response) {
      setResult(response as typeof result);
      setStep("done");
      notifySuccess("Datos importados correctamente");
      await refreshHistory();
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setStep("upload");
    setPreview(null);
    setValidation(null);
    setResult(null);
  };

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Importación de Datos"
        subtitle="Carga masiva de mediciones ambientales desde CSV y Excel · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Importe datos de campañas reales de monitoreo. Revise la vista previa, valide y confirme
              antes de insertar en PostgreSQL.
            </p>
            <a
              href="/examples/hydrovision-water-quality-example.csv"
              download
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              <FileDown className="h-4 w-4" />
              Descargar CSV de ejemplo
            </a>
          </div>

          {loading && <LoadingState message="Procesando archivo…" />}

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-800">
              <Upload className="h-4 w-4 text-cyan-600" />
              1. Seleccionar archivo
            </div>
            <FileUploader onFileSelected={handleFile} disabled={loading} />
          </Card>

          {preview && step !== "upload" && (
            <Card className="space-y-6 p-5">
              <h2 className="text-sm font-semibold text-slate-900">2. Vista previa</h2>
              <FilePreview
                headers={preview.headers}
                rows={preview.previewRows}
                rowCount={preview.rowCount}
                columnCount={preview.columnCount}
              />

              <h2 className="text-sm font-semibold text-slate-900">3. Mapeo de columnas</h2>
              <ColumnMapper headers={preview.headers} mapping={mapping} onChange={setMapping} />

              {step === "preview" && (
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  Validar datos
                </button>
              )}
            </Card>
          )}

          {validation && (step === "validated" || step === "done") && (
            <Card className="space-y-6 p-5">
              <h2 className="text-sm font-semibold text-slate-900">4. Resultado de validación</h2>
              <ValidationSummary summary={validation} />

              {step === "validated" && (
                <ImportConfirmation
                  summary={validation}
                  fileName={preview?.fileName ?? "archivo"}
                  onConfirm={handleImport}
                  onCancel={resetFlow}
                  loading={loading}
                />
              )}
            </Card>
          )}

          {result && step === "done" && (
            <Card className="p-5">
              <ImportResult
                importId={result.importId}
                importedRows={result.importedRows}
                rejectedRows={result.rejectedRows}
                status={result.status}
                message={result.message}
              />
              <button
                type="button"
                onClick={resetFlow}
                className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Nueva importación
              </button>
            </Card>
          )}

          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Historial de importaciones</h2>
            <ImportHistory items={history} />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
