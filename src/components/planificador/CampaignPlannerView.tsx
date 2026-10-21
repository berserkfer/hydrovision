"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { DataTag } from "@/components/ui/DataTag";
import { DREN_4000_POINTS, DREN_4000_RIO_ID } from "@/data/mock/dren-4000-real-data";
import type { CloudSuitability } from "@/satellite/opportunities/overpass";

interface Opportunity {
  date: string;
  daysFromToday: number;
  cloudCoverPercent: number | null;
  suitability: CloudSuitability;
  window: { from: string; to: string };
  recommended: boolean;
}

interface OpportunitiesResponse {
  ok: boolean;
  station?: { codigo: string; nombre: string };
  today?: string;
  opportunities?: Opportunity[];
  historyScenes?: number;
  disclaimer?: string;
  error?: string;
}

const STATIONS = DREN_4000_POINTS.map((p) => ({
  id: `${DREN_4000_RIO_ID}-${p.codigo.toLowerCase()}`,
  codigo: p.codigo,
  nombre: p.nombre,
}));

const SUITABILITY_LABEL: Record<CloudSuitability, string> = {
  good: "Buena",
  acceptable: "Aceptable",
  poor: "Mala",
  unknown: "Sin pronóstico",
};

const SUITABILITY_CLASS: Record<CloudSuitability, string> = {
  good: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/35 dark:text-emerald-300",
  acceptable: "bg-amber-500/12 text-amber-800 ring-amber-500/40 dark:text-amber-300",
  poor: "bg-red-500/10 text-red-700 ring-red-500/35 dark:text-red-300",
  unknown: "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-300",
};

export function CampaignPlannerView() {
  const [stationId, setStationId] = useState(STATIONS[5]?.id ?? STATIONS[0].id); // P6
  const [data, setData] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/satellite/opportunities?stationId=${stationId}&days=14`)
      .then((res) => res.json() as Promise<OpportunitiesResponse>)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, error: "No se pudo consultar el planificador." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  const opportunities = data?.opportunities ?? [];

  return (
    <MainLayout>
      <MonitoringHeader
        title="Planificador de campañas"
        subtitle="Próximas pasadas estimadas de Sentinel-2 y ventana de muestreo para que el par campo–satélite sea comparable."
        origin={
          <>
            <DataTag tone="caution">Fechas estimadas, no efeméride oficial</DataTag>
            <DataTag tone="neutral">Nubosidad: pronóstico Open-Meteo</DataTag>
          </>
        }
        showDisclaimer={false}
      />

      <PageContent>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="hv-eyebrow text-[10px]">
            Punto de monitoreo
          </label>
          <select
            value={stationId}
            onChange={(event) => setStationId(event.target.value)}
            className="rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-surface)] px-2.5 py-1.5 text-sm text-[var(--hv-foreground)]"
          >
            {STATIONS.map((station) => (
              <option key={station.id} value={station.id}>
                {station.codigo} — {station.nombre}
              </option>
            ))}
          </select>
          {data?.station ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Escenas analizadas en 60 días: {data.historyScenes ?? 0}
            </span>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Consultando pasadas y pronóstico…</p>
        ) : null}

        {!loading && data && !data.ok ? (
          <p className="rounded-[3px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {data.error ?? "No se pudo obtener el planificador."}
          </p>
        ) : null}

        {!loading && data?.ok ? (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--hv-border)] text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]">
                <tr>
                  <th className="px-4 py-2">Fecha estimada</th>
                  <th className="px-4 py-2">Días</th>
                  <th className="px-4 py-2">Nubosidad</th>
                  <th className="px-4 py-2">Ventana de muestreo (±3 d)</th>
                  <th className="px-4 py-2">Recomendación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-500">
                      Sin pasadas proyectadas con el historial disponible.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opportunity) => (
                    <tr key={opportunity.date}>
                      <td className="hv-num px-4 py-2 text-[13px] text-[var(--hv-ink)]">
                        {opportunity.date}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                        {opportunity.daysFromToday === 0 ? "hoy" : opportunity.daysFromToday}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SUITABILITY_CLASS[opportunity.suitability]}`}
                        >
                          {SUITABILITY_LABEL[opportunity.suitability]}
                          {opportunity.cloudCoverPercent !== null
                            ? ` · ${Math.round(opportunity.cloudCoverPercent)}%`
                            : ""}
                        </span>
                      </td>
                      <td className="hv-num px-4 py-2 text-[12px] text-slate-600 dark:text-slate-400">
                        {opportunity.window.from} a {opportunity.window.to}
                      </td>
                      <td className="px-4 py-2">
                        {opportunity.recommended ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            Muestrear
                          </span>
                        ) : (
                          <span className="text-slate-500">Por confirmar</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        ) : null}

        {data?.disclaimer ? (
          <p className="mt-4 flex max-w-[900px] items-start gap-2.5 rounded-[3px] border border-[var(--hv-disclaimer-border)] bg-[var(--hv-disclaimer-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--hv-disclaimer-text)]">
            <span className="mt-[5px] h-2 w-2 shrink-0 rotate-45 bg-amber-500" aria-hidden />
            {data.disclaimer}
          </p>
        ) : null}
      </PageContent>
    </MainLayout>
  );
}
