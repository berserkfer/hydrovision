"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { DataTag } from "@/components/ui/DataTag";
import { JobStatusBar } from "@/components/ui/JobStatusBar";
import { ChannelPolygonCard } from "@/components/satellite/ChannelPolygonCard";
import { cn, formatDate } from "@/lib/utils";
import type { JobState, StoredResult } from "@/server/jobs/background-jobs";
import type {
  ProposalMark,
  TramoFinderResult,
} from "@/server/satellite/tramos/tramo-finder.service";
import type { TramoCandidate } from "@/satellite/tramos/tramo-suitability";

interface Payload {
  state: JobState;
  latest: StoredResult<TramoFinderResult> | null;
  proposals: Record<string, ProposalMark>;
  ownImages: Record<string, { count: number; latest: string | null }>;
  uploadedTrace: { name: string; uploadedAt: string; hash: string } | null;
}

const API = "/api/satellite/tramos";

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)} %`;
}

function OriginTag({ c }: { c: TramoCandidate }) {
  if (c.role === "referencia") return <DataTag tone="real">Histórico · referencia</DataTag>;
  return c.origin === "historico" ? (
    <DataTag tone="real">Histórico {c.historicalCode}</DataTag>
  ) : (
    <DataTag tone="neutral">Nuevo</DataTag>
  );
}

export function TramoFinderView() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const r = await fetch(API);
      const body = (await r.json()) as { data?: Payload; error?: { message?: string } };
      if (!r.ok || !body.data) throw new Error(body.error?.message ?? `Error ${r.status}`);
      setData(body.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el resultado.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (data?.state.status !== "running") return;
    const t = setTimeout(() => void refresh(), 3000);
    return () => clearTimeout(t);
  }, [data]);

  async function startCalc() {
    setBusy(true);
    try {
      const r = await fetch(API, { method: "POST" });
      if (!r.ok) {
        const b = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(b?.error?.message ?? `Error ${r.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el cálculo.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleProposal(c: TramoCandidate, proposed: boolean) {
    if (!data?.latest) return;
    const traceKey = data.latest.result.traceKey;
    const r = await fetch(`${API}/propuestas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceKey, candidateId: c.id, proposed }),
    });
    if (r.ok) await refresh();
    else setError("No se pudo guardar la marca (requiere permiso de importación).");
  }

  async function uploadTrace(file: File) {
    setUploadMsg(null);
    const text = await file.text();
    const r = await fetch(`${API}/traza`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, geojson: text }),
    });
    const b = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
    setUploadMsg(r.ok ? `Traza "${file.name}" guardada. Recalcule para usarla.` : b?.error?.message ?? "No se pudo subir.");
    if (fileRef.current) fileRef.current.value = "";
    await refresh();
  }

  async function resetTrace() {
    await fetch(`${API}/traza`, { method: "DELETE" });
    setUploadMsg("Se volvió a la traza por defecto (P1 → P5). Recalcule para usarla.");
    await refresh();
  }

  const result = data?.latest?.result ?? null;
  const isProposed = (c: TramoCandidate) =>
    Boolean(result && data?.proposals[`${result.traceKey}|${c.id}`]?.proposed);

  const table = (rows: TramoCandidate[], withProposal: boolean) => (
    <section className="overflow-x-auto rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)]">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-[var(--hv-border)] text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Tramo</th>
            <th className="px-3 py-2">Origen</th>
            <th className="px-3 py-2">Aptitud</th>
            <th className="px-3 py-2">f_agua media</th>
            <th className="px-3 py-2">UTM 17S (E, N)</th>
            <th className="px-3 py-2">Geográficas</th>
            <th className="px-3 py-2">Histórico más cercano</th>
            <th className="px-3 py-2" title="Imágenes propias: verificación, no satélite">Imagen propia</th>
            {withProposal && <th className="px-3 py-2">Propuesto</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((c, i) => (
            <tr key={c.id} className={cn("align-top", isProposed(c) && "bg-[var(--hv-ink-wash)]")}>
              <td className="hv-num px-3 py-2.5 text-[12px] text-[var(--hv-foreground-dim)]">{i + 1}</td>
              <td className="px-3 py-2.5">
                <span className="font-medium text-[var(--hv-ink)]">{c.id}</span>
                {c.chainageM !== null && (
                  <span className="hv-num block text-[11px] text-[var(--hv-foreground-dim)]">{c.chainageM} m desde el inicio</span>
                )}
              </td>
              <td className="px-3 py-2.5"><OriginTag c={c} /></td>
              <td className="px-3 py-2.5">
                <span className="hv-num text-[13px] text-[var(--hv-ink)]">{pct(c.aptitudeFrequency)}</span>
                <span className="hv-num block text-[11px] text-[var(--hv-foreground-dim)]">
                  {c.scenesApt}/{c.scenesEvaluated} escenas{c.scenesDiscardedClouds ? ` · ${c.scenesDiscardedClouds} nubes` : ""}
                </span>
              </td>
              <td className="hv-num px-3 py-2.5 text-[12px]">{c.meanWaterFraction === null ? "—" : c.meanWaterFraction.toFixed(2)}</td>
              <td className="hv-num px-3 py-2.5 text-[11.5px]">{c.utm17s.easting.toFixed(1)}, {c.utm17s.northing.toFixed(1)}</td>
              <td className="hv-num px-3 py-2.5 text-[11.5px]">{c.coordinate.latitude.toFixed(6)}, {c.coordinate.longitude.toFixed(6)}</td>
              <td className="px-3 py-2.5 text-[12px]">
                {c.nearestHistorical.codigo} · <span className="hv-num">{c.nearestHistorical.distanceM} m</span>
              </td>
              <td className="px-3 py-2.5 text-xs text-[var(--hv-foreground-muted)]">
                {data?.ownImages?.[c.id]?.count ? (
                  <a href="/imagenes-propias" className="underline decoration-dotted">
                    {data.ownImages[c.id].count} imagen(es)
                  </a>
                ) : (
                  "—"
                )}
              </td>
              {withProposal && (
                <td className="px-3 py-2.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                    <input type="checkbox" checked={isProposed(c)} onChange={(e) => void toggleProposal(c, e.target.checked)} />
                    {isProposed(c) ? "Propuesto" : "Marcar"}
                  </label>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <MainLayout>
      <MonitoringHeader
        title="Tramos aptos para Sentinel-2"
        subtitle="Dónde muestrear dentro del Dren 4000 para que el par campo–satélite tenga agua visible en el píxel."
        origin={
          <>
            <DataTag tone="real">Escenas Sentinel-2 L2A reales · Planetary Computer</DataTag>
            <DataTag tone="caution">Propuesta de muestreo, no medición</DataTag>
          </>
        }
        showDisclaimer={false}
      />
      <PageContent>
        <div className="mx-auto max-w-[1600px] space-y-6">
          <JobStatusBar
            state={data?.state ?? null}
            computedAt={data?.latest?.computedAt ?? null}
            starting={busy}
            onStart={() => void startCalc()}
          />
          {error && (
            <p role="alert" className="rounded-[3px] border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <ChannelPolygonCard />

          <section className="grid gap-4 rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] p-4 lg:grid-cols-[1fr_auto]">
            <div className="text-sm">
              <p className="hv-eyebrow text-[9.5px]">Traza del dren</p>
              <p className="mt-1 text-[var(--hv-foreground)]">
                {data?.uploadedTrace
                  ? `GeoJSON subido: ${data.uploadedTrace.name} (${formatDate(data.uploadedTrace.uploadedAt)})`
                  : "Por defecto: rectas P1 → P5 entre los puntos históricos (aproximada)."}
              </p>
              {result && (
                <p className="mt-1 text-xs text-[var(--hv-foreground-muted)]">
                  Último cálculo: {result.trace.description} · {result.trace.lengthM} m · {result.trace.samples} puntos cada {result.trace.spacingM} m ·{" "}
                  {result.scenes.filter((s) => s.status === "read").length}/{result.scenes.length} escenas leídas
                </p>
              )}
              {uploadMsg && <p className="mt-2 text-xs text-[var(--hv-ink)]">{uploadMsg}</p>}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[var(--hv-ink)]/30 px-3 py-1.5 text-xs font-medium text-[var(--hv-ink)] hover:bg-[var(--hv-ink-wash)]">
                <Upload className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                Subir GeoJSON (línea o polígono)
                <input
                  ref={fileRef}
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadTrace(f);
                  }}
                />
              </label>
              {data?.uploadedTrace && (
                <button type="button" onClick={() => void resetTrace()} className="rounded-[3px] border border-[var(--hv-border)] px-3 py-1.5 text-xs text-[var(--hv-foreground-muted)]">
                  Usar traza por defecto
                </button>
              )}
            </div>
          </section>

          {!result && data?.state.status !== "running" && (
            <p className="text-sm text-[var(--hv-foreground-muted)]">
              Aún no hay resultados. Lance el cálculo: evalúa la traza cada 50 m en las 6 escenas más recientes (segundo plano).
            </p>
          )}

          {result && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[22px] font-light tracking-[-0.02em] text-[var(--hv-ink)]">Candidatos dentro del dren</h2>
                <a href={`${API}?format=csv`} className="inline-flex items-center gap-2 rounded-[3px] border border-[var(--hv-ink)]/30 px-3 py-1.5 text-xs font-medium text-[var(--hv-ink)] hover:bg-[var(--hv-ink-wash)]">
                  <Download className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                  Exportar CSV
                </a>
              </div>
              {table(result.candidates, true)}

              <h2 className="text-[22px] font-light tracking-[-0.02em] text-[var(--hv-ink)]">Referencia: puntos históricos con agua visible (P6–P10)</h2>
              {table(result.references, false)}

              <ul className="space-y-1.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
                {result.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500" aria-hidden />
                    {n}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </PageContent>
    </MainLayout>
  );
}
