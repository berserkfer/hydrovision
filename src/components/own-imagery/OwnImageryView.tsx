"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { DataTag } from "@/components/ui/DataTag";
import { formatDate } from "@/lib/utils";
import { DREN_4000_POINTS } from "@/data/mock/dren-4000-real-data";
import { OWN_IMAGE_DISCLAIMER, type OwnImageRecord } from "@/own-imagery/own-imagery.types";

interface TargetOption {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
}

const POINT_OPTIONS: TargetOption[] = DREN_4000_POINTS.map((p) => ({
  key: p.codigo,
  label: `${p.codigo} — ${p.nombre}`,
  latitude: p.coordenadas.latitude,
  longitude: p.coordenadas.longitude,
}));

export function OwnImageryView() {
  const [records, setRecords] = useState<OwnImageRecord[]>([]);
  const [tramoOptions, setTramoOptions] = useState<TargetOption[]>([]);
  const [targetKey, setTargetKey] = useState(POINT_OPTIONS[0].key);
  const [file, setFile] = useState<File | null>(null);
  const [windowM, setWindowM] = useState("30");
  const [camLat, setCamLat] = useState("");
  const [camLon, setCamLon] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/imagenes-propias");
    const b = (await r.json().catch(() => null)) as { data?: OwnImageRecord[] } | null;
    setRecords(b?.data ?? []);
  }

  useEffect(() => {
    void load();
    // Tramos propuestos del buscador como destinos posibles.
    fetch("/api/satellite/tramos")
      .then((r) => r.json())
      .then((b: { data?: { latest?: { result: { traceKey: string; candidates: Array<{ id: string; chainageM: number | null; coordinate: { latitude: number; longitude: number } }> } } | null; proposals?: Record<string, { proposed: boolean }> } }) => {
        const result = b.data?.latest?.result;
        if (!result) return;
        const proposed = result.candidates.filter((c) => b.data?.proposals?.[`${result.traceKey}|${c.id}`]?.proposed);
        setTramoOptions(
          proposed.map((c) => ({
            key: `T:${c.id}`,
            label: `Tramo propuesto ${c.id}${c.chainageM !== null ? ` (${c.chainageM} m)` : ""}`,
            latitude: c.coordinate.latitude,
            longitude: c.coordinate.longitude,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const options = useMemo(() => [...POINT_OPTIONS, ...tramoOptions], [tramoOptions]);
  const target = options.find((o) => o.key === targetKey) ?? options[0];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    form.set("targetLabel", target.key.startsWith("T:") ? target.label : target.key);
    form.set("latitude", String(target.latitude));
    form.set("longitude", String(target.longitude));
    form.set("windowM", windowM);
    if (camLat && camLon) {
      form.set("cameraLatitude", camLat);
      form.set("cameraLongitude", camLon);
    }
    try {
      const r = await fetch("/api/imagenes-propias", { method: "POST", body: form });
      const b = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
      setMessage(r.ok ? { ok: true, text: `"${file.name}" procesada.` } : { ok: false, text: b?.error?.message ?? "No se pudo procesar la imagen." });
      if (r.ok) {
        setFile(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/imagenes-propias/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <MainLayout>
      <MonitoringHeader
        title="Imágenes propias (dron y campo)"
        subtitle="Recorte a la ventana del punto y señal promedio por banda, para verificar visualmente el tramo."
        origin={
          <>
            <DataTag tone="caution">Apoyo y verificación — no satélite</DataTag>
            <DataTag tone="neutral">Fuente: imagen_propia</DataTag>
          </>
        }
        showDisclaimer={false}
      />
      <PageContent>
        <div className="mx-auto max-w-[1600px] space-y-6">
          <p className="flex max-w-[900px] items-start gap-2.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
            <span className="mt-[5px] h-2 w-2 shrink-0 rotate-45 bg-amber-500" aria-hidden />
            {OWN_IMAGE_DISCLAIMER}
          </p>

          <form onSubmit={submit} className="grid gap-4 rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] p-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm">
              <span className="hv-eyebrow text-[9.5px]">Archivo (GeoTIFF o foto JPEG/PNG)</span>
              <input
                type="file"
                accept=".tif,.tiff,image/tiff,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-xs"
              />
            </label>
            <label className="block text-sm">
              <span className="hv-eyebrow text-[9.5px]">Punto o tramo</span>
              <select
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                className="mt-1.5 w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2.5 py-1.5 text-sm"
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="hv-eyebrow text-[9.5px]">Ventana (m, GeoTIFF)</span>
              <input
                type="number"
                min={5}
                max={200}
                value={windowM}
                onChange={(e) => setWindowM(e.target.value)}
                className="mt-1.5 w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2.5 py-1.5 text-sm"
              />
            </label>
            <div className="text-sm">
              <span className="hv-eyebrow text-[9.5px]">Cámara (solo fotos sin GPS)</span>
              <div className="mt-1.5 flex gap-2">
                <input placeholder="Latitud" value={camLat} onChange={(e) => setCamLat(e.target.value)} className="w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2 py-1.5 text-xs" />
                <input placeholder="Longitud" value={camLon} onChange={(e) => setCamLon(e.target.value)} className="w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2 py-1.5 text-xs" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                disabled={!file || busy}
                className="inline-flex items-center gap-2 rounded-[3px] bg-[var(--hv-ink)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--hv-primary-foreground)] disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                {busy ? "Procesando…" : "Subir y recortar"}
              </button>
              {message && (
                <span role={message.ok ? "status" : "alert"} className={message.ok ? "text-xs text-[var(--hv-ink)]" : "text-xs text-red-700"}>
                  {message.text}
                </span>
              )}
            </div>
          </form>

          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[22px] font-light tracking-[-0.02em] text-[var(--hv-ink)]">Registros ({records.length})</h2>
            <a href="/api/imagenes-propias?format=csv" className="inline-flex items-center gap-2 rounded-[3px] border border-[var(--hv-ink)]/30 px-3 py-1.5 text-xs font-medium text-[var(--hv-ink)] hover:bg-[var(--hv-ink-wash)]">
              <Download className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
              Exportar CSV (imagen_propia)
            </a>
          </div>

          <section className="overflow-x-auto rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)]">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[var(--hv-border)] text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]">
                <tr>
                  <th className="px-3 py-2">Fuente</th>
                  <th className="px-3 py-2">Archivo</th>
                  <th className="px-3 py-2">Punto / tramo</th>
                  <th className="px-3 py-2">Georreferencia</th>
                  <th className="px-3 py-2">Recorte</th>
                  <th className="px-3 py-2">Señal promedio por banda</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-[var(--hv-foreground-muted)]">Aún no hay imágenes propias.</td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2.5"><DataTag tone="caution">imagen_propia</DataTag></td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-[var(--hv-ink)]">{r.fileName}</span>
                        <span className="block text-[11px] text-[var(--hv-foreground-dim)]">
                          {r.kind === "geotiff" ? "GeoTIFF" : "Foto"} · {formatDate(r.uploadedAt)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{r.target.label}</td>
                      <td className="px-3 py-2.5 text-xs text-[var(--hv-foreground-muted)]">
                        {r.georef.method === "geotiff" ? `${r.georef.crs} · píxel ${r.georef.resolutionM} m` : `${r.georef.method === "exif_gps" ? "GPS EXIF" : "Manual"} · cámara a ${r.georef.distanceToTargetM} m`}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--hv-foreground-muted)]">
                        {r.crop.method === "ventana_geografica" ? `${r.crop.windowM} m` : "centro de la imagen"} · {r.crop.widthPx}×{r.crop.heightPx} px
                      </td>
                      <td className="hv-num px-3 py-2.5 text-[11.5px]">
                        {r.bands.map((b) => (
                          <span key={b.name} className="mr-3 inline-block">
                            {b.name}: {b.mean ?? "—"}
                            {b.std !== null && <span className="text-[var(--hv-foreground-dim)]"> ±{b.std}</span>}
                          </span>
                        ))}
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => void remove(r.id)} aria-label={`Eliminar ${r.fileName}`} className="rounded-full p-1.5 text-[var(--hv-foreground-dim)] hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </PageContent>
    </MainLayout>
  );
}
