"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SemaphoreIndicator, type SemaphoreStatus } from "@/components/admin/SemaphoreIndicator";
import { cn } from "@/lib/utils";

interface StatusSection {
  id: string;
  label: string;
  status: SemaphoreStatus;
  message: string;
  details: string[];
}

interface SystemStatusResponse {
  overall: SemaphoreStatus;
  checkedAt: string;
  sections: StatusSection[];
  configurationValid: boolean;
}

interface ConnectionTestResponse {
  success: boolean;
  simulated: boolean;
  message: string;
  testedAt: string;
  tokenPreview?: string;
  errors?: string[];
}

export function SystemStatusPanel() {
  const [snapshot, setSnapshot] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/system-status");
      if (!response.ok) throw new Error("No se pudo cargar el estado del sistema.");
      const data = (await response.json()) as SystemStatusResponse;
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/gee/test-connection", { method: "POST" });
      const data = (await response.json()) as ConnectionTestResponse;
      setTestResult(data);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Diagnóstico del Sistema</h1>
          <p className="mt-1 text-sm text-slate-500">
            Panel interno — Sprint 2 · Autenticación GEE (simulada)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => void handleTestConnection()}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            <Zap className={cn("h-4 w-4", testing && "animate-pulse")} />
            Probar Conexión
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {testResult && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            testResult.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          <p className="font-medium">{testResult.message}</p>
          {testResult.tokenPreview && (
            <p className="mt-1 font-mono text-xs opacity-80">Token: {testResult.tokenPreview}</p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-600" />
              <CardTitle>Estado general</CardTitle>
            </div>
            {snapshot && (
              <SemaphoreIndicator status={snapshot.overall} showLabel />
            )}
          </div>
          <CardDescription>
            {snapshot
              ? `Última verificación: ${new Date(snapshot.checkedAt).toLocaleString("es-PE")}`
              : "Cargando diagnóstico…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !snapshot ? (
            <p className="text-sm text-slate-500">Obteniendo estado del sistema…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {snapshot?.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {section.message}
                      </p>
                    </div>
                    <SemaphoreIndicator status={section.status} />
                  </div>
                  {section.details.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-slate-200/80 pt-3">
                      {section.details.map((detail) => (
                        <li key={detail} className="font-mono text-[11px] text-slate-500">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
