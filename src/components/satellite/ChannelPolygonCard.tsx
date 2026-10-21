"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { DataTag } from "@/components/ui/DataTag";
import { formatDate } from "@/lib/utils";

interface ChannelSummary {
  name: string;
  uploadedAt: string;
  areaM2: number;
  vertices: number;
  polygons: number;
  sourceCrs: string;
}

/** Polígono del cauce: con él, el píxel de agua debe quedar dentro (prioridad sobre la conectividad). */
export function ChannelPolygonCard({ onChange }: { onChange?: () => void }) {
  const [channel, setChannel] = useState<ChannelSummary | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/satellite/cauce");
    const b = (await r.json().catch(() => null)) as { data?: ChannelSummary | null } | null;
    setChannel(b?.data ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(file: File) {
    setMessage(null);
    const r = await fetch("/api/satellite/cauce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, geojson: await file.text() }),
    });
    const b = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
    setMessage(
      r.ok
        ? { ok: true, text: `Polígono "${file.name}" validado y guardado. Recalcule los reportes para aplicarlo.` }
        : { ok: false, text: b?.error?.message ?? "No se pudo subir el polígono." }
    );
    if (fileRef.current) fileRef.current.value = "";
    await load();
    onChange?.();
  }

  async function remove() {
    await fetch("/api/satellite/cauce", { method: "DELETE" });
    setMessage({ ok: true, text: "Polígono eliminado: se vuelve al criterio de cuerpo de agua conexo." });
    await load();
    onChange?.();
  }

  return (
    <section className="grid gap-4 rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] p-4 lg:grid-cols-[1fr_auto]">
      <div className="text-sm">
        <p className="hv-eyebrow text-[9.5px]">Polígono del cauce</p>
        {channel ? (
          <>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[var(--hv-foreground)]">
              <DataTag tone="real">Activo</DataTag>
              {channel.name} · {channel.polygons} polígono(s) · {channel.vertices} vértices ·{" "}
              <span className="hv-num">{(channel.areaM2 / 10_000).toFixed(2)} ha</span> · {channel.sourceCrs}
            </p>
            <p className="mt-1 text-xs text-[var(--hv-foreground-muted)]">
              Subido el {formatDate(channel.uploadedAt)}. El píxel de agua debe quedar dentro de este polígono.
            </p>
          </>
        ) : (
          <p className="mt-1 text-[var(--hv-foreground)]">
            Sin polígono: &quot;dentro del cauce&quot; = cuerpo de agua conexo de ≥ 3 píxeles.
          </p>
        )}
        <p className="mt-1 text-[11px] text-[var(--hv-foreground-dim)]">
          GeoJSON Polygon/MultiPolygon en WGS84 o UTM 17S (EPSG:32717), sin autointersecciones, máx. 1 MB.
        </p>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "mt-2 text-xs text-[var(--hv-ink)]" : "mt-2 text-xs text-red-700"}>
            {message.text}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[var(--hv-ink)]/30 px-3 py-1.5 text-xs font-medium text-[var(--hv-ink)] hover:bg-[var(--hv-ink-wash)]">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
          {channel ? "Reemplazar polígono" : "Subir polígono del cauce"}
          <input
            ref={fileRef}
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {channel && (
          <button type="button" onClick={() => void remove()} className="rounded-[3px] border border-[var(--hv-border)] px-3 py-1.5 text-xs text-[var(--hv-foreground-muted)]">
            Quitar polígono
          </button>
        )}
      </div>
    </section>
  );
}
