import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { getDataStore } from "@/data/store-access";
import { classifyForPointType } from "@/lib/eca/classifier";
import {
  POINT_TYPE_LABELS,
  resolveProfileForPointType,
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
  compliant: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  alert: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  non_compliant: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
  insufficient_data: "bg-slate-500/15 text-slate-600 ring-slate-500/30 dark:text-slate-300",
};

/**
 * Tipo de punto según el código del Dren 4000.
 * P8 es agua de proceso, no un punto de descarga: no se evalúa contra LMP ni ECA.
 */
function pointTypeFor(codigo: string): MonitoringPointType | null {
  const n = Number.parseInt(codigo.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  if (n === 1) return "efluente_ptar";
  if (n >= 2 && n <= 5) return "efluente_pesca";
  if (n === 8) return null;
  if (n >= 6) return "mar";
  return "cauce";
}

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
}

function buildResults(): PointResult[] {
  const store = getDataStore();
  const stations = store.estaciones
    .filter((e) => e.rioId === DREN_RIO_ID)
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));

  return stations.map((station) => {
    const muestras = store.muestras
      .filter((m) => m.estacionId === station.id)
      .sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo));
    const muestra = muestras[0];
    if (!muestra) {
      return { station, fecha: "—", pointType: null, evaluation: null, reason: "Sin muestreos registrados." };
    }

    const params = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!params) {
      return { station, fecha: muestra.fechaMuestreo, pointType: null, evaluation: null, reason: "Sin parámetros para la muestra." };
    }

    const pointType = pointTypeFor(station.codigo);
    if (!pointType) {
      return {
        station,
        fecha: muestra.fechaMuestreo,
        pointType: null,
        evaluation: null,
        reason: "Agua de proceso: no es punto de descarga, no le aplica LMP ni ECA.",
      };
    }

    const measurement = toMeasurement(params, station.codigo, muestra.fechaMuestreo);
    return {
      station,
      fecha: muestra.fechaMuestreo,
      pointType,
      evaluation: classifyForPointType(measurement, pointType),
    };
  });
}

function StatusPill({ status }: { status: NormativeEvaluation["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function NormativeComplianceView() {
  const results = buildResults();
  const evaluated = results.filter((r) => r.evaluation);
  const counts = {
    compliant: evaluated.filter((r) => r.evaluation?.status === "compliant").length,
    alert: evaluated.filter((r) => r.evaluation?.status === "alert").length,
    non_compliant: evaluated.filter((r) => r.evaluation?.status === "non_compliant").length,
  };

  return (
    <MainLayout>
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Cumplimiento normativo — ECA y LMP
        </h1>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Cada punto se evalúa con el instrumento que le corresponde: LMP para efluentes, ECA
          para el cuerpo de agua receptor.
        </p>
      </header>

      <PageContent>
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <p>
            <strong>ECA</strong> (D.S. N° 004-2017-MINAM) aplica al cuerpo de agua: E2 para el
            cauce y E3 para la zona marina. <strong>LMP</strong> (D.S. N° 003-2010-MINAM y D.S.
            N° 010-2008-PRODUCE) aplica al efluente en su punto de descarga. Mezclar ambos
            instrumentos en un mismo veredicto sería un error metodológico.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Los valores de fósforo total no se comparan contra fosfatos: se reportan como no
            aplicables hasta contar con la variable que exige la norma.
          </p>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cumplen</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {counts.compliant}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">En alerta</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {counts.alert}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">No cumplen</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {counts.non_compliant}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Punto</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Instrumento</th>
                <th className="px-4 py-2">Fecha</th>
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
                    {r.fecha.slice(0, 10)}
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
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
