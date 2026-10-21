import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { DataTag } from "@/components/ui/DataTag";
import { PageContent } from "@/components/layout/PageContent";
import { getDataStore } from "@/data/store-access";
import { classifyForPointType } from "@/lib/eca/classifier";
import {
  NORMATIVE_PROFILES,
  POINT_TYPE_LABELS,
  evaluateNormative,
  getProfileById,
  pointTypeForCode,
  type MonitoringPointType,
  type NormativeEvaluation,
} from "@/lib/normative";
import type { Estacion } from "@/models/station";
import type { ParametrosFisicoquimicos } from "@/models/monitoring";
import type { FieldMeasurement } from "@/types";

const DREN_RIO_ID = "dren-4000";

const STATUS_LABEL: Record<NormativeEvaluation["status"], string> = {
  compliant: "Cumple",
  alert: "En alerta",
  non_compliant: "No cumple",
  insufficient_data: "Sin datos",
};

const STATUS_CLASS: Record<NormativeEvaluation["status"], string> = {
  compliant: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/35 dark:text-emerald-300",
  alert: "bg-amber-500/12 text-amber-800 ring-amber-500/40 dark:text-amber-300",
  non_compliant: "bg-red-500/10 text-red-700 ring-red-500/35 dark:text-red-300",
  insufficient_data: "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-300",
};

/**
 * P8 es agua de proceso, no un punto de descarga: no se evalúa contra LMP ni ECA.
 * El mapeo por código vive en `@/lib/normative/point-types`.
 */

function toMeasurement(
  params: ParametrosFisicoquimicos,
  codigo: string,
  fecha: string
): FieldMeasurement {
  return {
    id: params.id,
    stationId: codigo,
    sampledAt: fecha,
    ph: params.ph,
    turbidity: params.turbidez,
    conductivity: params.conductividad,
    dissolvedOxygen: params.oxigenoDisuelto,
    temperature: params.temperatura,
    bod5: params.dbo5,
    cod: params.dqo,
    coliforms: params.coliformes,
    thermotolerantColiforms: params.coliformesTermotolerantes,
    nitrates: params.nitratos,
    phosphates: params.fosfatos,
    totalSuspendedSolids: params.solidosSuspendidosTotales,
    isSimulated: params.isSimulated,
  };
}

interface PointResult {
  station: Estacion;
  fecha: string;
  pointType: MonitoringPointType | null;
  evaluation: NormativeEvaluation | null;
  reason?: string;
  /** Origen de la muestra evaluada; null si no hay muestra o parámetros. */
  isSimulated: boolean | null;
}

function buildResults(profileOverrideId?: string): PointResult[] {
  const store = getDataStore();
  const override = profileOverrideId ? getProfileById(profileOverrideId) : undefined;
  const stations = store.estaciones
    .filter((e) => e.rioId === DREN_RIO_ID)
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));

  return stations.map((station) => {
    const muestras = store.muestras
      .filter((m) => m.estacionId === station.id)
      .sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo));
    const muestra = muestras[0];
    if (!muestra) {
      return { station, fecha: "—", pointType: null, evaluation: null, reason: "Sin muestreos registrados.", isSimulated: null };
    }

    const params = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!params) {
      return { station, fecha: muestra.fechaMuestreo, pointType: null, evaluation: null, reason: "Sin parámetros para la muestra.", isSimulated: null };
    }

    const pointType = pointTypeForCode(station.codigo);
    if (!pointType) {
      return {
        station,
        fecha: muestra.fechaMuestreo,
        pointType: null,
        evaluation: null,
        reason: "Agua de proceso: no es punto de descarga, no le aplica LMP ni ECA.",
        isSimulated: params.isSimulated,
      };
    }

    const measurement = toMeasurement(params, station.codigo, muestra.fechaMuestreo);
    return {
      station,
      fecha: muestra.fechaMuestreo,
      pointType,
      isSimulated: params.isSimulated,
      evaluation: override
        ? evaluateNormative(measurement, override)
        : classifyForPointType(measurement, pointType),
    };
  });
}

function StatusPill({ status }: { status: NormativeEvaluation["status"] }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function NormativeComplianceView({
  profileOverrideId,
}: {
  profileOverrideId?: string;
}) {
  const results = buildResults(profileOverrideId);
  const evaluated = results.filter((r) => r.evaluation);
  const activeProfile = profileOverrideId ? getProfileById(profileOverrideId) : undefined;
  const withOrigin = results.filter((r) => r.isSimulated !== null);
  const realCount = withOrigin.filter((r) => r.isSimulated === false).length;
  const simulatedCount = withOrigin.filter((r) => r.isSimulated === true).length;
  const realYears = Array.from(
    new Set(withOrigin.filter((r) => r.isSimulated === false).map((r) => r.fecha.slice(0, 4)))
  ).sort();
  const origin = (
    <>
      {realCount > 0 && (
        <span role="status" aria-label="Datos reales">
          <DataTag tone="real">Datos reales · {realYears.join(", ")} (Nizama y Cabrera)</DataTag>
        </span>
      )}
      {simulatedCount > 0 && (
        <DataTag tone="simulated">
          {realCount > 0 ? `${simulatedCount} punto(s) con datos simulados` : "Datos simulados"}
        </DataTag>
      )}
      {withOrigin.length === 0 && <DataTag tone="neutral">Sin datos para evaluar</DataTag>}
    </>
  );

  const counts = {
    compliant: evaluated.filter((r) => r.evaluation?.status === "compliant").length,
    alert: evaluated.filter((r) => r.evaluation?.status === "alert").length,
    non_compliant: evaluated.filter((r) => r.evaluation?.status === "non_compliant").length,
  };

  return (
    <MainLayout>
      <MonitoringHeader
        title="Cumplimiento normativo — ECA y LMP"
        subtitle="Cada punto se evalúa con el instrumento que le corresponde: LMP para efluentes, ECA para el cuerpo de agua receptor."
        origin={origin}
        showDisclaimer={simulatedCount > 0}
      />

      <PageContent>
        <nav className="mb-4 flex flex-wrap gap-2 text-xs" aria-label="Selector de perfil normativo">
          <a
            href="/normativa"
            className={`rounded-[3px] px-2.5 py-1 ring-1 ring-inset ${
              activeProfile
                ? "bg-transparent text-slate-600 ring-slate-300 hover:ring-[var(--hv-ink)]/40 dark:text-slate-300 dark:ring-slate-700"
                : "bg-[var(--hv-ink)] text-[var(--hv-primary-foreground)] ring-[var(--hv-ink)]"
            }`}
          >
            Por tipo de punto (recomendado)
          </a>
          {NORMATIVE_PROFILES.map((profile) => (
            <a
              key={profile.id}
              href={`/normativa?perfil=${profile.id}`}
              className={`rounded-[3px] px-2.5 py-1 ring-1 ring-inset ${
                activeProfile?.id === profile.id
                  ? "bg-[var(--hv-ink)] text-[var(--hv-primary-foreground)] ring-[var(--hv-ink)]"
                  : "bg-transparent text-slate-600 ring-slate-300 hover:ring-[var(--hv-ink)]/40 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {profile.label}
            </a>
          ))}
        </nav>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <p>
            {activeProfile ? (
              <>
                Estás evaluando <strong>todos los puntos</strong> contra{" "}
                <strong>{activeProfile.label}</strong> ({activeProfile.instrument}). Es una vista
                comparativa: un efluente no deja de estar sujeto a LMP porque lo compares contra
                ECA.
              </>
            ) : (
              <>
                <strong>ECA</strong> (D.S. N° 004-2017-MINAM) aplica al cuerpo de agua: E2 para el
                cauce y E3 para la zona marina. <strong>LMP</strong> (D.S. N° 003-2010-MINAM y
                D.S. N° 010-2008-PRODUCE) aplica al efluente en su punto de descarga. Mezclar
                ambos instrumentos en un mismo veredicto sería un error metodológico.
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Los valores de fósforo total no se comparan contra fosfatos: se reportan como no
            aplicables hasta contar con la variable que exige la norma.
          </p>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="hv-eyebrow text-[9.5px]">Cumplen</p>
            <p className="mt-3 text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums text-emerald-600 dark:text-emerald-400">
              {counts.compliant}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="hv-eyebrow text-[9.5px]">En alerta</p>
            <p className="mt-3 text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums text-amber-600 dark:text-amber-400">
              {counts.alert}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="hv-eyebrow text-[9.5px]">No cumplen</p>
            <p className="mt-3 text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums text-red-600 dark:text-red-400">
              {counts.non_compliant}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--hv-border)] text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]">
              <tr>
                <th className="px-4 py-2">Punto</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Instrumento</th>
                <th className="px-4 py-2">Fecha · origen</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Parámetros fuera de límite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((r) => (
                <tr key={r.station.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {r.station.codigo}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.pointType ? POINT_TYPE_LABELS[r.pointType] : "No aplica"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.evaluation?.profile.label ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <span className="hv-num block whitespace-nowrap text-[12px]">{r.fecha.slice(0, 10)}</span>
                    {r.isSimulated !== null && (
                      <DataTag tone={r.isSimulated ? "simulated" : "real"} className="mt-1">
                        {r.isSimulated ? "Simulado" : "Real"}
                      </DataTag>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.evaluation ? <StatusPill status={r.evaluation.status} /> : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.evaluation?.violations.length
                      ? r.evaluation.violations.map((v) => v.label).join(", ")
                      : r.reason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="hv-eyebrow">
            Detalle por punto
          </h2>
          {evaluated.map((r) => (
            <details
              key={r.station.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="cursor-pointer text-sm font-medium text-slate-900 dark:text-slate-100">
                {r.station.codigo} — {r.evaluation?.profile.label}{" "}
                {r.evaluation ? <StatusPill status={r.evaluation.status} /> : null}
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1 pr-4">Parámetro</th>
                      <th className="py-1 pr-4">Valor</th>
                      <th className="py-1 pr-4">Límite</th>
                      <th className="py-1 pr-4">Estado</th>
                      <th className="py-1">Fuente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.evaluation?.parameters.map((p) => (
                      <tr key={p.parameter} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-4 text-slate-700 dark:text-slate-300">{p.label}</td>
                        <td className="py-1 pr-4">
                          {p.value === null ? "—" : `${p.value} ${p.unit}`}
                        </td>
                        <td className="py-1 pr-4">
                          {p.min !== undefined && p.max !== undefined
                            ? `${p.min} – ${p.max}`
                            : p.max !== undefined
                              ? `≤ ${p.max}`
                              : p.min !== undefined
                                ? `≥ ${p.min}`
                                : "—"}
                        </td>
                        <td className="py-1 pr-4">
                          {p.status === "compliant"
                            ? "Cumple"
                            : p.status === "alert"
                              ? "Alerta"
                              : p.status === "non_compliant"
                                ? "No cumple"
                                : p.status === "not_measured"
                                  ? "Sin dato"
                                  : "No aplica"}
                        </td>
                        <td className="py-1 text-slate-500 dark:text-slate-400">
                          {p.source ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </section>
      </PageContent>
    </MainLayout>
  );
}
